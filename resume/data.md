# Jordan Cleal.

<mr.jordan.cleal+resume@gmail.com>

[+61 434 557 224](tel:+61434557224)

[jcleal.me](https://jcleal.me) | [LinkedIn](https://linkedin.com/in/jordancleal) | [GitHub](https://github.com/jcleal)

### Summary.

A passionate DevOps Engineer seeking to broaden their knowledge and experience into unknown territories.

* Competent in the design, creation, and deployment of solutions to cloud platforms.

* Passionate about automation, particularly creating bots, automating manual processes, and ingesting data from APIs.

* Enthusiastic about learning new technologies, tools, and practices.

* Confident with task management, and operating in the Agile environment.

* Enthusiastic about CI/CD practices and getting the most out of CI/CD.

* Problem-solving oriented.

* Known for writing code and documentation that is reliable, maintainable, and reusable.

### Skills.

**Programming / Scripting Languages**: Go, Bash; dabbled in JavaScript, Typescript, C++, C#, PowerShell.

**Frameworks & Tools**: git, docker, docker-compose, awscli, sam (AWS SAM), make.

**Cloud Vendors**: AWS - CloudFormation, Route53, CloudFront, API Gateway, S3 (Storage + Hosting), EC2, SSM (Automations + Parameter Store), Lambda, CloudWatch, MSK, Kinesis Data Firehose, DynamoDB, AMP + AMG; dabbled with Kinesis, SNS + SQS, EKS, Open Search + Kibana, Glue + Athena + QuickSight.

**API Styles**: REST, GraphQL.

**CI/CD**: Buildkite, GitHub Actions; dabbled in Jenkins.

**Vendor Management**: GitHub, Buildkite, AWS, Sumo Logic, New Relic, Datadog.

**Development approaches**: Infrastructure-as-code, command line over UI, prototyping in Bash before writing in Go.

### Professional Experience.

#### Senior DevOps Engineer, Observability team @ [MYOB](https://myob.com.au).

Melbourne | December 2021 - Current

* Spearheaded the creation of an all-in-one document for a centralized observability platform backed by a single observability vendor: gathering requirements from ~20 teams across the business, evaluating vendor offerings, driving conversations with key stakeholders, and providing tools to help drive decisions. This document, along with the team, was a core component in the acceptance of the proposed multi-million dollar direction by the business.

* Assisted in the design, architecture, documentation, and creation of a centralized observability platform for logs, metrics, and traces. This platform is built using Open Telemetry collectors hosted in AWS Fargate, uses AWS MSK for a queue between ingress and egress microservices, and sends the received observability data to Sumo Logic.

* Implemented an internal monitoring system for the centalized observability platform, allowing the team to have visibility into the overall performance of the system, through dashboards and alerts in AWS AMP + AMG.

* Optimized the CI/CD pipeline for the centalized observability platform, reducing time-to-production from ~90 minutes to ~40 minutes though a multitude of optimizations (dynamically generated pipeline, different tiers of agents aka. instance types, splittings jobs across multiple agents).

* Assisted in the deprecation of Jaeger across the business, saving the business ~35k per month in AWS costs.

* Created an internal Buildkite plugin for teams to scan and upload results from a SonarQube scan to an internally managed SonarQube instance, saving teams the time and effort in writing this functionality into the own repositories.

* Assisted in the design and creation of a Buildkite plugin to upload documentation to an internal Backstage.io service, saving teams the time and effort in writing this functionality into their own repositories.

* Created a tool to automatically add a warning annotation when certain conditions are not met when running a build on a Linux Buildkite Agent, resulting in an uptick of the number of adoptions of the internal Backstage.io service.

* Ran multiple day-long sessions for various Junior DevOps engineers, focused on writing Bash scripts, Go testing, CI/CD + Buildkite in general, and building Slack Apps, resulting in two nominations for the passion award by attendees.

#### DevOps Engineer, Observability team @ [MYOB](https://myob.com.au).

Melbourne | September 2019 - December 2021

* Managed Sumo Logic, New Relic, Datadog at an organizational level.

* Introduced various automations to uplift team practices, which contributed to a reductions in the overall number of orphaned pull requests & branches per GitHub repository, a decrease in the number of failing builds in Buildkite, reduced lead times, automated departures for people leaving the business, and a reduction in the overall cost of the teams AWS accounts.

* Contributed to the uplift of the centralized logging platform to allow for ingestion of PCI data, resulting in the decommission of Splunk, saving over USD $200K for the business.

* Designed and implemented a custom Slack app to streamline the existing incident management process, resulting in quicker response times for the incident management team, and a centralized way for teams to see incidents across the business.

* Lead the user management of New Relic, reducing overall full user count from 350+ full users to > 200 full users, resulting in the business not being overcharged for users outside the contractual paid seats.

* Uplifted the centralized logging platform to support the Sumo Logic Credits Model, resulting in a reduction of the overall credits used, and allowing teams to utilize the vendor more for the same cost.

* Uplifted the CI/CD practices of the team by introducing a centralized Docker image repository, decreasing overall deploy times.

* Assisted in the ISO 27001 audit for three controls around log backups, which contributed to the business achieving certification.

* Contributed to the design and creation of an alternative logging platform POC built using Loki, Grafana, and AWS EKS. The platform was not productionized, but was focused on providing a logging platform that had no costs tied to ingestion for the business.

* Travelled to other offices in the business (Sydney, Auckland) to assist presenting workshops focused around logging and tracing to teams, promoting best practices and growing adoption of internal platforms and services.

* Mentored multiple proteges over many months though the businesses internal protege program. Attended multiple quorum sessions to provide feedback to proteges.

* Added retention limitations and optimizations to the AWS S3 backups for the centralized logging platform, saving cost and reducing overall storage size.

#### Associate DevOps Engineer, CI/CD team @ [MYOB](myob.com.au).

Melbourne | October 2017 - September 2019

* Managed GitHub, Buildkite, and AWS at an organizational level.

* Assisted in the creation, documentation, and release of a managed CI/CD solution to over 200 AWS account, reducing the number of CI/CD platforms across the business to a single platform, Buildkite. In addition, helped grow adoption of this solution by pairing, coaching, and training teams directly through pairing and running workshops, increasing overall adoption.

* Created SDKs, written in Go, over the GitHub, Buildkite, VictorOps, and other internal REST / GraphQL APIs. These were used to create CLI tools for teams to easily retrieve data from these vendors.

* Worked with various developers across the business to uplift their CI/CD practices. Some examples include incorporating Docker in their repositories, replacing their existing CI/CD solution with our managed CI/CD solution, and driving adoption of various internal tools in the process.

* Created a custom Windows Buildkite Agent for teams looking for a managed CI/CD solution where the Linux based Buildkite Agents wouldn't work. This resulted in teams having a consistent approach for either Linux & Windows CI/CD workloads, reducing the complexity for Windows based teams to on-board to our managed CI/CD solution.

* Lead the user management of Buildkite & GitHub, reducing overall number of paid users to only those who needed it, resulting in the business not being overcharged for users outside the contractual paid seats for these vendors.

#### Graduate Developer, Multiple teams @ [MYOB](myob.com.au).

 Melbourne | January 2017 - October 2017

* Rotated into multiple teams across the business to learn about core concepts like Agile practices, programming at an enterprise level, DevOps, CI/CD, and automation in-general.

* Promoted early out of the graduate program, being the first to be promoted for the 2017 graduate program intake.

### Education.

#### Bachelor of Information Technology @ [Deakin University](https://www.deakin.edu.au/)

Waurn Ponds Campus | March 2013 - October 2016

(Majors in Games Design & Development and Software Development)

* Received the _Deakin University Information Technology Project Award_ for receiving the highest mark overall in the final capstone unit for the quarter. Acted as project lead in an external project for Barwon Health.

* Hand selected to travel overseas to Indonesia as part of Deakin University to observe and critique the cultural difference in player expectations and decision-making in game design, when compared to the current standards in Australia.


### References.

_Can be provided upon request._
