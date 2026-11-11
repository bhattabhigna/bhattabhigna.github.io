---
permalink: /research/
title: "Research"
author_profile: true
---

{% include base_path %}

<p class="lead">My research asks how periodic and locally resonant structures can be designed to control waves and isolate vibration, particularly at low frequencies.</p>

<figure class="site-figure"><a href="{{ base_path }}/images/schematics/research-map.svg"><img src="{{ base_path }}/images/schematics/research-map.svg" alt="Research map: elastic metamaterials at the centre; around them Bragg scattering, local resonance, inertial amplification, nonlinear dynamics, disorder and localisation, and Bloch–Floquet theory; in the outer ring applications in aerospace (cabin noise, sandwich panels, satellite isolation), mechanical (machinery mounts, energy harvesting, mechanical computing) and civil engineering (seismic barriers, railway vibration, base-isolated buildings)"></a><figcaption>From concepts to applications: the theories that govern wave control in metamaterials, and where they are used across civil, aerospace and mechanical engineering. Select the figure to enlarge it.</figcaption></figure>

## Current focus

**Low-frequency vibration isolation in sandwich structures (IISc Bengaluru).** Under my ANRF National Postdoctoral Fellowship, I am studying wave propagation in metamaterial-based sandwich structures for aerospace applications.

## Research directions and interests

- Extending metamaterial design for practical vibration control.
- Exploring metamaterial concepts for energy harvesting and structural health monitoring.
- Disordered metamaterials and Anderson localisation.
- Mechanical computing using metamaterials.

## Ideas and emerging directions

**Lightweight sandwich structures that block low frequencies.** Embedding resonators in the core of aerospace sandwich panels can stop low-frequency vibration without heavy damping layers. The open challenge is to keep attenuation broadband while the panel still carries load and can be manufactured at scale.

**Civil-scale vibration barriers.** Recent reviews describe meta-concrete, periodic foundations and buried resonators for seismic and traffic vibration [1, 2]. Closed-form design rules for bandgap position and width could make such barriers easier to size for real soil and structures.

**Disorder as a design tool.** Manufacturing variability is usually treated as a defect, yet disorder can localise waves, as shown for flexural waves in disordered beams [3]. Combining local resonance with controlled disorder, and quantifying it statistically, is a route to broadband attenuation.

**Mechanical computing.** Bistable metamaterial elements can store information and perform logic [4, 5]. Nonlinear wave propagation and bandgaps that switch on and off offer a way to carry and process signals mechanically.

**Physics-informed, data-driven design.** Machine learning is now widely used to predict band structures and to inverse-design phononic metamaterials [6]. Analytical solutions for band boundaries can serve as fast, interpretable constraints inside such design loops.

**Energy harvesting and structural health monitoring.** Resonators that trap vibrational energy can also convert it to electricity, and shifts in a bandgap can reveal damage, so the same structure could isolate, harvest and sense.

<ol class="concept-params">
  <li>H. Wang et al., <a href="https://doi.org/10.3390/ma18174032">Engineering metamaterials for civil infrastructure: From acoustic performance to programmable mechanical responses</a>, <em>Materials</em>, 18, 4032, 2025.</li>
  <li>X. Zhang, W. Liu and Q. Shi, <a href="https://www.citedrive.com/en/discovery/experimental-research-progress-of-seismic-metamaterials-structural-configurations-attenuation-mechanisms-and-engineering-prospects/">Experimental research progress of seismic metamaterials: Structural configurations, attenuation mechanisms, and engineering prospects</a>, <em>Materials</em>, 2026.</li>
  <li>J. Calleja Ángel, J. C. Torres Guzmán and A. Díaz de Anda, <a href="https://doi.org/10.1038/s41598-019-39623-2">Anderson localization of flexural waves in disordered elastic beams</a>, <em>Scientific Reports</em>, 9, 3572, 2019.</li>
  <li>J. D. Paulsen and N. C. Keim, <a href="https://arxiv.org/abs/2405.08158">Mechanical memories in solids, from disorder to design</a>, Annual Reviews (preprint arXiv:2405.08158).</li>
  <li>H. Chen et al., <a href="https://arxiv.org/abs/2306.02352">Mechanical transistors for logic-with-memory computing</a>, arXiv:2306.02352.</li>
  <li>Muhammad, J. Kennedy and C. W. Lim, <a href="https://doi.org/10.1016/j.mtcomm.2022.104606">Machine learning and deep learning in phononic crystals and metamaterials – A review</a>, <em>Materials Today Communications</em>, 33, 104606, 2022.</li>
</ol>

## Foundations from my published work

### Analytical theory of bandgaps

<div class="figure-row"><img src="{{ base_path }}/images/schematics/monocoupled.svg" alt="Schematic of the system studied" loading="lazy"><img src="{{ base_path }}/images/schematics/double-attenuation.svg" alt="Schematic of the system studied" loading="lazy"></div>

Closed-form expressions for attenuation peaks and band boundaries, and the mechanism behind double attenuation peaks.

- [Closed-form solutions for general monocoupled systems]({{ base_path }}/publication/2022-09-01-closed-form-solutions-monocoupled), *Journal of Sound and Vibration* (2022)
- [Double attenuation peaks with simultaneous negative mass and stiffness]({{ base_path }}/publication/2022-07-01-double-attenuation-negative-mass-stiffness), *Physics Letters A* (2022)

### Rigid-elastic metabeams and relative resonance

<div class="figure-row"><img src="{{ base_path }}/images/schematics/metabeam.svg" alt="Schematic of the system studied" loading="lazy"><img src="{{ base_path }}/images/schematics/relative-resonance.svg" alt="Schematic of the system studied" loading="lazy"></div>

Combining rigid and elastic segments to shape flexural waves and isolate vibration.

- [Flexural wave propagation in rigid elastic combined metabeam]({{ base_path }}/publication/2023-01-01-flexural-wave-propagation-metabeam), *Journal of Vibration and Acoustics* (2023)
- [Vibration isolation by relative resonance]({{ base_path }}/publication/2024-01-01-vibration-isolation-rigid-bodies), *Journal of Sound and Vibration* (2024)

### Nonlinear and damped wave propagation

<div class="figure-row"><img src="{{ base_path }}/images/schematics/nonlinear-beam.svg" alt="Schematic of the system studied" loading="lazy"></div>

The effect of nonlinear stiffness and damping on dispersion, using multiple-scales analysis.

- [Damped beam on cubic nonlinear springs]({{ base_path }}/publication/2024-04-01-wave-dispersion-cubic-nonlinear-springs), *Physical Review E* (2024)

## Methods

- **Analytical:** Bloch–Floquet analysis, multiple-scales perturbation, transfer matrix and spectral element methods, uncertainty quantification
- **Numerical:** MATLAB, Python, COMSOL Multiphysics, Mathematica
- **Experimental:** laser Doppler vibrometry, shaker testing, high-speed imaging, 3D-printed prototypes, LabVIEW data acquisition
