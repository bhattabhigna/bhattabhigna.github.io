---
layout: archive
title: "Sitemap"
permalink: /sitemap/
author_profile: true
---

{% include base_path %}

<h2>Pages</h2>
<ul>
{% for p in site.pages %}{% if p.title and p.sitemap != false and p.url != "/sitemap/" and p.url != "/404.html" %}
  <li><a href="{{ base_path }}{{ p.url }}">{{ p.title }}</a></li>
{% endif %}{% endfor %}
</ul>

<h2>Publications</h2>
<ul>
{% for p in site.publications reversed %}
  <li><a href="{{ base_path }}{{ p.url }}">{{ p.title }}</a></li>
{% endfor %}
</ul>
