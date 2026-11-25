/* One reversible scroll timeline owns the five landings, line and departure. */
(() => {
  const clamp = value => Math.max(0, Math.min(1, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  const hits = [.18, .36, .54, .72, .90];
  const arrivals = hits.map(hit => hit - .07);

  function create({start, end, closeAt, width, height, holding, landings, logo, lead, clearance=.08}) {
    const span = Math.max(1, end - start);
    // Keep each sphere on its dot as the rail exits. Release only once every
    // destination in the next sculpture is BELOW its release position.
    const releaseShift = Math.max(.24, ...landings.map((point,i)=>point.y-logo[i].y+clearance));
    const releaseAt = end + releaseShift * height;
    function sample(y, stageShift = Math.min(0, (end - y) / height)) {
      const progress = clamp((y - start) / span);
      const departure = ease((y - releaseAt) / Math.max(1, closeAt - releaseAt));
      // The lower pieces lead along their same straight, downward paths.
      const raw=clamp((y-releaseAt)/Math.max(1,closeAt-releaseAt));
      const flightOut=i=>ease(raw+(i===3?.22:i===4?.30:0)*Math.sin(Math.PI*raw)**2);
      const flights = arrivals.map(at => ease((progress - (at - .11)) / .11));
      const nodes = holding.map((origin, i) => {
        const destination = landings[i], flight = flights[i];
        if (y > end) {
          if (y <= releaseAt) return {...destination,y:destination.y+stageShift};
          return {
            x: mix(destination.x, logo[i].x, flightOut(i)),
            y: mix(destination.y-releaseShift, logo[i].y, flightOut(i)),
            r: mix(destination.r, logo[i].r, flightOut(i))
          };
        }
        // Both coordinates use the same easing: one straight flight, no detour.
        return {
          x: mix(origin.x, destination.x, flight),
          y: mix(origin.y, destination.y, flight),
          r: mix(origin.r, destination.r, flight)
        };
      });
      const radiusX = landings.map(point=>point.r*height/width);
      // The signal exits the fifth sphere too, so its glow can finish naturally.
      const stops = [{at: .12, x: landings[0].x - lead}, ...hits.map((at, i) => ({at, x: landings[i].x})), {at:.96,x:landings[4].x+radiusX[4]*1.5}];
      let lineX = stops[0].x;
      for (let i = 1; i < stops.length; i++) {
        if (progress >= stops[i].at) lineX = stops[i].x;
        else if (progress > stops[i - 1].at) { lineX = mix(stops[i - 1].x, stops[i].x, ease((progress - stops[i - 1].at) / (stops[i].at - stops[i - 1].at))); break; }
        else break;
      }
      const glow=landings.map((point,i)=>y<=end&&progress>=arrivals[i]?ease((1-Math.abs(lineX-point.x)/radiusX[i])/.3):0);
      nodes.forEach((node,i)=>{node.r*=1+.12*glow[i];});
      return {
        nodes, join: 0, progress, departure, lineX,
        landed: arrivals.map(at => progress >= at),
        struck: hits.map(at => progress >= at),
        glow,
        phase: y >= closeAt ? 'rejoined' : y > releaseAt ? 'departing' : y > end ? 'attached' : progress >= hits[4] ? 'complete' : progress > 0 ? 'landing' : 'waiting'
      };
    }
    return {sample, start, end, releaseAt, releaseShift, closeAt, landings, lead, hits, arrivals};
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {create};
  else window.TelzaApproachMotion = {create};
})();
