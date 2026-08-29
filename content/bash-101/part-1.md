---
title: 1. Basics.
images: [/img/bash-101/logo.png]
---

## What is a shell?

A shell is a program that takes the commands you type and passes them to the operating system to execute. When you open a terminal and type `ls` or `cd`, the shell is the interpreter turning those words into system calls.

Bash stands for **Bourne Again Shell** — it is an enhanced version of the original Unix `sh` shell. Most Linux systems use it as the default, and it is the most widely used scripting shell in the world. Even if you use `zsh` or `fish` day to day, you will encounter Bash scripts everywhere.

---

## Your first output: `echo`

`echo` prints text to the terminal. It is the simplest way to verify something is working.

```bash
echo "Hello, world"
```

You can echo variables, command output, or just plain strings. It is the Bash equivalent of a print statement.

---

## Variables

Variables in Bash do not need a type declaration — you just assign a value. No spaces around the `=`.

```bash
name="Jordan"
echo "Hello, $name"
```

Use `$` to reference the variable. Wrap the variable name in curly braces when the intent might be ambiguous:

```bash
greeting="Good morning"
echo "${greeting}, everyone"
```

Variables are untyped — everything is a string unless you treat it as a number.

---

## Reading user input with `read`

`read` pauses execution and waits for the user to type something, then stores the input in a variable.

```bash
echo "What is your name?"
read user_name
echo "Hello, $user_name"
```

You can also prompt inline using `-p`:

```bash
read -p "Enter your name: " user_name
echo "Welcome, $user_name"
```

---

## Arithmetic with `$(( ))`

Bash handles integer arithmetic with the `$(( ))` syntax:

```bash
a=10
b=3
echo "Sum: $((a + b))"
echo "Product: $((a * b))"
echo "Remainder: $((a % b))"
```

This only works with integers. For floating-point arithmetic you would use `bc` or `awk`, but for most scripting tasks integers are enough.

---

## Conditional logic with `if`

`if` tests a condition and executes a block of code only when the condition is true.

```bash
score=85

if [ "$score" -ge 90 ]; then
  echo "Distinction"
elif [ "$score" -ge 75 ]; then
  echo "Credit"
else
  echo "Pass"
fi
```

The spaces inside `[ ]` are required. The condition uses test operators: `-eq` (equal), `-ne` (not equal), `-lt` (less than), `-gt` (greater than), `-ge` (greater than or equal), `-le` (less than or equal).

For string comparisons use `=` and `!=`:

```bash
colour="blue"

if [ "$colour" = "blue" ]; then
  echo "It is blue"
fi
```

Always quote variables inside `[ ]` to avoid errors when a variable is empty.

---

## Try it yourself

1. Write a script that asks for two numbers, adds them together, and prints the result. Test that it handles the case where the first number is larger than the second differently from when the second is larger.

2. Write a script that asks for your name and then prints a personalised greeting that changes based on the time of day. Use `$(date +%H)` to get the current hour as a number.

3. Write a script called `grade.sh` that reads a score from the user, then prints `Distinction` (90+), `Credit` (75–89), `Pass` (50–74), or `Fail` (below 50). Run it several times with different scores to confirm each branch works.
