---
date: 2025-11-03
title: "OpenTelemetry: what I wish I'd known"
description: "Practical lessons from building an observability platform on top of OTel collectors, AWS MSK, and Sumo Logic."
tags: [opentelemetry, observability, platform-engineering, go]
---

I spent two years on MYOB's observability team building a centralised observability platform from scratch. The core of it was OpenTelemetry collectors running in AWS Fargate, receiving signals from across the business, and routing them to Sumo Logic. It processed logs, metrics, and traces for dozens of teams.

Here's what I wish I'd known before we started.

---

## OTel isn't an observability tool — it's a plumbing standard

The most important mental shift is this: OpenTelemetry is not a backend. It doesn't store your data, doesn't give you dashboards, doesn't alert on anything. It's a standard for how signals move between systems.

When you use OTel, you're choosing:
1. How applications emit signals (the SDK — libraries for Go, Python, Java, etc.)
2. How signals are collected and routed (the Collector — an agent/gateway that receives, processes, and exports)
3. Where signals end up (your backend — Sumo Logic, Datadog, Grafana, whatever)

The Collector is the part most people underestimate. It's not a simple forwarder. It has a pipeline model with receivers, processors, and exporters. Understanding that pipeline is the difference between a reliable platform and one that loses data under load.

---

## The Collector pipeline model

Every Collector pipeline looks like this:

```yaml
service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch, memory_limiter]
      exporters: [otlphttp/backend]
```

**Receivers** accept incoming signals. OTLP (gRPC or HTTP) is the native format. You can also receive Prometheus metrics, Jaeger traces, Fluent Bit logs — the Collector speaks many protocols.

**Processors** transform signals in flight. The two you should always include:

- `memory_limiter` — prevents the Collector from OOMing when traffic spikes. Set it. Seriously. We learned this the hard way.
- `batch` — buffers signals before exporting. Without it, you're making an HTTP request per span, which is catastrophically slow.

```yaml
processors:
  memory_limiter:
    check_interval: 1s
    limit_percentage: 75
    spike_limit_percentage: 20
  batch:
    timeout: 5s
    send_batch_size: 512
```

**Exporters** send signals to the backend. OTLP HTTP/gRPC for OTel-native backends. Most vendors now support OTLP directly, which means you can swap backends without changing your applications.

---

## The queue in the middle

For our platform, we put AWS MSK (managed Kafka) between the ingress Collectors (receiving from applications) and egress Collectors (sending to Sumo Logic). This gave us:

- **Backpressure isolation** — if Sumo Logic was slow or down, we weren't dropping signals at the application level
- **Replay** — retention on the Kafka topic meant we could replay data if something went wrong downstream
- **Decoupled scaling** — ingress and egress could scale independently

The tradeoff is complexity. Kafka is not free to operate. For a smaller platform, a Collector with a persistent queue exporter and retry logic is probably enough. We needed Kafka because of the scale, but I'd think twice before adding it for a team of ten.

---

## Instrumentation in Go

Adding OTel to a Go service is straightforward once you understand the setup pattern:

```go
// Set up a tracer provider
tp, err := newTracerProvider(ctx, serviceName)
if err != nil {
    log.Fatal(err)
}
defer tp.Shutdown(ctx)
otel.SetTracerProvider(tp)

// In your code
tracer := otel.Tracer("my-package")

func doSomething(ctx context.Context) error {
    ctx, span := tracer.Start(ctx, "doSomething")
    defer span.End()

    // ... your work ...

    if err != nil {
        span.SetStatus(codes.Error, err.Error())
        span.RecordError(err)
        return err
    }
    return nil
}
```

The important things:

- Pass `context.Context` everywhere. OTel propagates trace context through it. If you don't have `ctx` flowing through your call chain, you're instrumenting in isolation.
- Always `defer span.End()`. Unclosed spans cause memory leaks.
- Use `span.RecordError(err)` — it attaches the error to the span with a stack trace. `span.SetStatus(codes.Error, ...)` marks the span as failed so it shows up in error dashboards.

---

## The metrics naming problem

This is the thing that bit us most. Metric naming in OTel follows the OpenMetrics convention — dots for hierarchy, underscores for separators within a component. But many backends have their own conventions and will transform names on ingestion.

```
# OTel name
http.server.request.duration

# After Prometheus export: dots become underscores
http_server_request_duration_seconds_bucket
```

The problem isn't the transformation itself — it's inconsistency. If some metrics are emitted by the SDK and others by your own instrumentation, and you mix naming conventions, your dashboards become a maze.

Pick a convention at the start and enforce it. Ours: `{service}.{component}.{operation}.{unit}`. It's not perfect but it's consistent, which matters more.

---

## Sampling

By default, OTel traces everything. At any real scale, this is expensive — both in Collector resources and in backend storage costs.

Head-based sampling (decision made at the start of a trace) is simple:

```go
// Sample 10% of traces
sampler := sdktrace.TraceIDRatioBased(0.1)
```

But it's blunt. A 10% sample will miss your rarest errors. For a platform, tail-based sampling is better — the Collector makes the sampling decision after the full trace is assembled, so you can guarantee that all error traces are kept while sampling down healthy ones.

The Collector's `tail_sampling` processor handles this:

```yaml
processors:
  tail_sampling:
    decision_wait: 10s
    policies:
      - name: errors
        type: status_code
        status_code: {status_codes: [ERROR]}
      - name: slow-traces
        type: latency
        latency: {threshold_ms: 1000}
      - name: sample-rest
        type: probabilistic
        probabilistic: {sampling_percentage: 5}
```

Keep all errors, keep slow traces, sample 5% of everything else.

---

## The thing nobody tells you

The hardest part of running an observability platform isn't the technology. It's convincing teams to instrument their applications. You can build the best Collector pipeline in the world and it doesn't matter if nothing is emitting signals.

The approach that worked for us: instrumentation as a service. We provided SDK wrappers, code samples, and a working example repository for Go and Python. We ran workshops. We paired with teams directly during their initial setup. We made the path of least resistance the correct path.

Adoption is a product problem, not an infrastructure problem. Treat it that way.

---

The platform we built saved roughly $35K/month by deprecating Jaeger, cut our pipeline deploy times in half, and gave the business visibility into traces it had never had before. None of that would have mattered if we hadn't spent as much time on adoption as we did on the architecture.

If you're building something similar and have questions, [reach out](/contact).
