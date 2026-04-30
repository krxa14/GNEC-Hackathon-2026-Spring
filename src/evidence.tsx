export function Evidence() {
  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-accent-soft">Evidence</p>
        <h1 className="text-3xl leading-tight">Why this product is shaped the way it is.</h1>
        <p className="text-sm leading-relaxed text-ink-300">
          Each section below maps one source cluster to one feature. The point is scope honesty, not borrowed authority.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-2xl">1. The problem</h2>
        <p className="text-sm leading-relaxed text-ink-300">
          Humanitarian workers carry disproportionate exposure to trauma, chronic stress, grief, moral conflict, and repeated loss while working in settings where formal care may be scarce or unsafe to access. ShadowFile starts from that workforce reality rather than treating distress as a generic wellness problem.
        </p>
        <p className="text-sm leading-relaxed text-ink-300">
          Sources: Connorton et al. (2012), "Humanitarian Aid Workers and Trauma-Related Mental Illness",{" "}
          <em>Epidemiologic Reviews</em> 34(1).{" "}
          <a href="https://doi.org/10.1093/epirev/mxr026" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink-100">doi:10.1093/epirev/mxr026</a>.{" "}
          IASC, <em>Guidelines on Mental Health and Psychosocial Support in Emergency Settings</em> (2007).{" "}
          <a href="https://www.who.int/publications/i/item/guidelines-on-mental-health-psychosocial-support-in-emergency-settings" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink-100">WHO link</a>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">2. Check-in tone</h2>
        <p className="text-sm leading-relaxed text-ink-300">
          The offshift check-in is deliberately brief, steady, and non-performative. Its tone is closer to Psychological First Aid than therapy language: notice, listen, and link, without over-instructing or pretending to solve the whole situation in one exchange.
        </p>
        <p className="text-sm leading-relaxed text-ink-300">
          Source: WHO, <em>Psychological First Aid: Guide for Field Workers</em> (2011).{" "}
          <a href="https://www.who.int/publications/i/item/9789241548205" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink-100">WHO link</a>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">3. Risk recognition</h2>
        <p className="text-sm leading-relaxed text-ink-300">
          ShadowFile is designed to recognize concerning language and route the user toward a clearer safety step. It does not diagnose, and it does not claim to deliver a clinical intervention. The design goal is recognition, escalation, and handoff.
        </p>
        <p className="text-sm leading-relaxed text-ink-300">
          Source: WHO, <em>mhGAP Humanitarian Intervention Guide</em> (2015, updated 2016).{" "}
          <a href="https://www.who.int/publications/i/item/9789241549691" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink-100">WHO link</a>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">4. Suicide risk screen</h2>
        <p className="text-sm leading-relaxed text-ink-300">
          When the app needs a more direct safety check, it uses the public-use Columbia C-SSRS screener wording and routes urgent responses toward crisis contact options. The items are there to structure a plain risk check, not to stand in for a clinician.
        </p>
        <p className="text-sm leading-relaxed text-ink-300">
          Sources: Posner et al. (2011), "The Columbia–Suicide Severity Rating Scale",{" "}
          <em>Archives of General Psychiatry</em> 68(12).{" "}
          <a href="https://doi.org/10.1001/archgenpsychiatry.2011.777" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink-100">doi:10.1001/archgenpsychiatry.2011.777</a>.{" "}
          Columbia Lighthouse Project,{" "}
          <a href="https://cssrs.columbia.edu" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink-100">cssrs.columbia.edu</a> (public-use screener).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">5. Workforce QoL screen</h2>
        <p className="text-sm leading-relaxed text-ink-300">
          The monthly ProQOL screen exists to separate three different patterns that often get flattened together: compassion satisfaction, burnout, and secondary traumatic stress. That helps the product ask a better next question without pretending to produce a diagnosis.
        </p>
        <p className="text-sm leading-relaxed text-ink-300">
          Source: Stamm, B.H. (2010), <em>The Concise ProQOL Manual</em>, 2nd ed.{" "}
          <a href="https://proqol.org" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink-100">proqol.org</a> (free-use terms; items used with permission).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">6. Moral injury framing</h2>
        <p className="text-sm leading-relaxed text-ink-300">
          The moral-injury walkthrough is based on the idea that some wounds are not best described as stress alone. The flow uses the three recurring moral-injury patterns of perpetration, betrayal, and witnessing to help the user name what kind of injury they are carrying, without forcing repair or reassurance.
        </p>
        <p className="text-sm leading-relaxed text-ink-300">
          Sources: Shay, J. (1994), <em>Achilles in Vietnam: Combat Trauma and the Undoing of Character</em>. Atheneum.{" "}
          Litz et al. (2009), "Moral injury and moral repair in war veterans",{" "}
          <em>Clinical Psychology Review</em> 29(8).{" "}
          <a href="https://doi.org/10.1016/j.cpr.2009.07.003" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink-100">doi:10.1016/j.cpr.2009.07.003</a>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">7. Defusion language</h2>
        <p className="text-sm leading-relaxed text-ink-300">
          When ShadowFile uses defusion-style wording, it does so to create a little space around overwhelming thoughts without arguing with the user’s reality. The app does not claim to deliver ACT as treatment; it borrows only narrow language moves that can lower pressure without invalidating what happened.
        </p>
        <p className="text-sm leading-relaxed text-ink-300">
          Source: Hayes, S.C., Strosahl, K.D., & Wilson, K.G. (2011), <em>Acceptance and Commitment Therapy: The Process and Practice of Mindful Change</em>, 2nd ed. Guilford Press.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">8. What ShadowFile does not claim</h2>
        <p className="text-sm leading-relaxed text-ink-300">
          ShadowFile is a companion, not a clinician. It does not diagnose. It does not replace a crisis line, therapist, supervisor, or emergency response. It is not endorsed by WHO, Columbia, ProQOL.org, or the authors cited above. These sources shape specific features only: tone, recognition language, screener structure, and moral-injury framing.
        </p>
      </section>
    </article>
  );
}
