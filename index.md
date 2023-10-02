---
layout: grid
title: "linuxgeek Tech Notes"
---

## Recent Posts

<div>
  {% for post in site.posts %}
    <p>
      <a href="{{ post.url }}">{{ post.title }}.</a> {{ post.tagline }}
    </p>
  {% endfor %}
</div>
