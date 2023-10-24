---
layout: post
title: "Enforce pre-commit framework checks on GitHub / GitLab"
description: "Enhance Code Quality with Pre-Commit Framework Checks on GitLab and GitHub."
toc: true
tags:
  - Python
  - pre-commit
  - GitHub
  - GitHub Actions
  - GitLab
  - GitLab CI/CD
---

If you're already using the [pre-commit framework](https://pre-commit.com/) for your Python or other projects, you might want to ensure its enforcement when code is pushed to a GitHub or GitLab repository. However, installing Git hooks directly on GitHub or GitLab can be challenging (although it's feasible on GitLab with some effort). In this article, we'll explore how to address this.

The concept is straightforward: we want to run pre-commit checks against **all files** in a repository through a GitHub Action or a GitLab CI/CD job. This way, we can guarantee that the code has already passed all the pre-commit checks on a developer's machine during the commit process.

When the run takes place, if nothing has changed, it means that nothing needs to be altered, and the code has already successfully passed the pre-commit hook locally. In this scenario, the GitHub Action or GitLab CI/CD job returns an exit code of 0, or an error code if an issue arises. To ensure code quality, you should make this job mandatory and halt further CI/CD actions in the event of an error.

## General Pre-Commit Configuration

The beauty of this approach is that you don't need to set up any additional configurations. It will utilize the standard `.pre-commit-config.yaml`, much like the locally installed pre-commit framework.

Let's consider a basic example of a `.pre-commit-config.yaml` file. In this configuration, we add newline characters to the end of a file, remove trailing spaces from strings, and perform checks on Python Abstract Syntax Trees (AST) and YAML:

```yaml
files: '.*\.(py|yml|yaml)$'
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: end-of-file-fixer
      - id: trailing-whitespace
      - id: check-ast
      - id: check-yaml
```

## GitHub Actions

Inside your repository, create a `.github/workflows/pre-commit.yml` file and add the following contents:

```yaml
name: pre-commit

on: [push, pull_request]

jobs:
  pre-commit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      - run: pip install pre-commit
      - run: pre-commit install
      - run: pre-commit run --all-files
```

This GitHub Action will automatically trigger pre-commit checks when changes are pushed to any PR. It ensures that all files in the repository are consistent with the pre-commit checks you've configured in your `.pre-commit-config.yaml`.

You may also check [pre-commit GitHub Action](https://github.com/pre-commit/action) (in maintenance-only mode and will not be accepting new features) & [pre-commit.ci](https://pre-commit.ci/) (free for open source repositories) for alternative approaches to integrating pre-commit checks into your workflow.

## GitLab CI/CD

Add the following to `.gitlab-ci.yml`:

```yaml
pre-commit:
  image: python:3.10-bullseye
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      when: always
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      when: always
  variables:
    GIT_DEPTH: "0"
  before_script:
    - pip install pre-commit
    - pre-commit install
  script:
    - pre-commit run --all-files
```

This job will run on every push to any MR.

---

References:

* [pre-commit](https://pre-commit.com/)
* [pre-commit.ci](https://pre-commit.ci/)
