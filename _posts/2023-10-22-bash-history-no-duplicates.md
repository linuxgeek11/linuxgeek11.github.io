---
layout: post
title: "Prevent duplicates from being written to the Bash history"
description: "Easy trick to prevent duplicates in Bash history & to make the history available across all sessions."
toc: false
tags:
  - Linux
  - Bash
---

To prevent duplicates from being written to the Bash history and to make the history immediately available across all console sessions, you can add the following lines to your `.bashrc` or `.bash_profile` file in your home directory:

```shell
# Prevent duplicates in Bash history.
export HISTCONTROL=ignoreboth:erasedups

# Save all history immediately and share across all sessions.
export PROMPT_COMMAND="history -a; history -n; $PROMPT_COMMAND"
```

`export HISTCONTROL=ignoreboth:erasedups` sets the `HISTCONTROL` environment variable. `ignoreboth` tells Bash to ignore lines that start with a space (which is common when you enter passwords), and `erasedups` prevents duplicated commands from being written to the history file.

`export PROMPT_COMMAND="history -a; history -n; $PROMPT_COMMAND"` ensures that the history is saved immediately (`history -a`) and reloaded (`history -n`) each time a command is executed. This makes the history immediately available across all Bash sessions.

After adding these lines to your `.bashrc` or `.bash_profile` file, you can either restart your terminal or run `source ~/.bashrc` (or `source ~/.bash_profile` depending on your configuration) for the changes to take effect.
