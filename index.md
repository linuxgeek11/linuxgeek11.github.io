---
layout: grid
title: "linuxgeek Tech Notes"
---

## Recent Posts

<div>
  {% for post in site.posts %}
    <p>
      <span class="time">{{ post.date | date: "%b %-d, %Y" }}</span>
      <a href="{{ post.url }}">{{ post.title }}.</a> {{ post.description }}
    </p>
  {% endfor %}
</div>
