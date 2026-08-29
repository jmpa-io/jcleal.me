---
title: 2. Setup.
---

## Checking your current shell

Before changing anything, check what shell you are actually running:

```bash
echo $SHELL
```

This prints the path to your default shell — something like `/bin/bash` or `/bin/zsh`. Note that this shows the login shell, not necessarily the shell in your current terminal session.

---

## Setting Bash as your default shell

**On macOS:**

Bash may not be the default on newer Macs (macOS ships with `zsh` since Catalina). To switch:

```bash
chsh -s /bin/bash
```

You will need to close and reopen your terminal for the change to take effect. Check the result with `echo $SHELL`.

**On Linux (Ubuntu/Debian):**

```bash
chsh -s /bin/bash
```

Or use the interactive tool:

```bash
sudo dpkg-reconfigure dash
```

Select `No` when asked if `dash` should be the system shell.

---

## `.bashrc` vs `.bash_profile`

Bash reads different files depending on how it is started:

- **`.bash_profile`** — read for login shells (when you first log in to a machine or open a new terminal on macOS)
- **`.bashrc`** — read for interactive non-login shells (a new terminal tab on Linux, running `bash` inside a running session)

**The practical solution:** put everything in `.bashrc` and source it from `.bash_profile`:

```bash
# In ~/.bash_profile
if [ -f ~/.bashrc ]; then
  source ~/.bashrc
fi
```

This means your environment is consistent regardless of how the shell was started.

---

## Adding to `$PATH`

`$PATH` is a colon-separated list of directories where Bash looks for commands. To add a new directory — say `~/bin` where you keep personal scripts:

```bash
export PATH="$HOME/bin:$PATH"
```

Put this in `~/.bashrc`. The `:$PATH` at the end preserves all existing entries — omitting it would break every other command.

---

## Aliases

Aliases let you create shortcuts for commands you run often:

```bash
alias ll="ls -lh"
alias gs="git status"
alias ..="cd .."
alias grep="grep --color=auto"
```

Put your aliases in `~/.bashrc`. They are only available in interactive shells, not in scripts.

---

## Sourcing your config

After editing `~/.bashrc`, apply the changes to your current session without opening a new terminal:

```bash
source ~/.bashrc
```

Or the shorthand:

```bash
. ~/.bashrc
```

---

## Setup checklist

- [ ] Confirmed current shell with `echo $SHELL`
- [ ] Set Bash as default shell with `chsh -s /bin/bash` (if switching from another shell)
- [ ] Created `~/.bashrc` if it does not exist
- [ ] Added `source ~/.bashrc` call in `~/.bash_profile`
- [ ] Added personal script directory to `$PATH`
- [ ] Added at least two useful aliases
- [ ] Sourced `~/.bashrc` in the current session to apply changes
- [ ] Opened a new terminal and verified aliases and `$PATH` changes are active
