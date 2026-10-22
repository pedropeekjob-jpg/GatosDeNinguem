import { AnimatedLogo } from "@gn/ui";

// Runs as soon as the splash is parsed: shown once per visit, never with reduced motion, and kept up for a
// short moment (or until the page has loaded) so the cat can be seen playing with its ball.
const script = `(function(){var s=document.getElementById("gn-splash");if(!s)return;try{if(sessionStorage.getItem("gn-splash")||matchMedia("(prefers-reduced-motion: reduce)").matches){s.remove();return}sessionStorage.setItem("gn-splash","1")}catch(e){}var t0=Date.now();function hide(){setTimeout(function(){s.classList.add("is-done");setTimeout(function(){s.remove()},400)},Math.max(0,1400-(Date.now()-t0)))}if(document.readyState==="complete")hide();else addEventListener("load",hide)})();`;

/** The loader the first time someone opens the site: the logo's cat bats its ball while the page gets ready. */
export function Splash() {
  return (
    <>
      <div id="gn-splash" className="splash">
        <AnimatedLogo variant="loader" size={150} />
      </div>
      <script dangerouslySetInnerHTML={{ __html: script }} />
    </>
  );
}
