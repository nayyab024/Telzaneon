/* One model for the hero and closing mark. Coordinates are in logo units. */
(() => {
  const model={
    // This order also preserves the non-crossing paths out of the FAQ.
    points:[[-1.14,.10,.455],[.01,1.05,.43],[1.10,.10,.465],[0,.10,.33],[-.02,-1.06,.47]],
    // Fan out in spatial order before converging onto the product baseline.
    heroSplit:{rowSlots:[-2,1,2,0,-1],spreadEnd:.64,settleStart:.28},
    joint:{radius:.105,blend:.16,epsilon:.001,rightBlend:.06,cut:.5},
    pose:{yaw:.12,pitch:-.05},
    camera:{depth:8.5,focal:4,plane:2.125}
  };
  if(typeof module!=='undefined'&&module.exports)module.exports=model;
  else window.TelzaLogoGeometry=model;
})();
