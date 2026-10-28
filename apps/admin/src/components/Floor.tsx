import { useEffect, useRef } from 'react';

import { OVERVIEW, SalonScene, type FloorView } from '../three/salon';
import { Stage } from '../three/stage';

/** The salon in 3D, live: one WebGL view for as long as the panel is open; the floor is pushed in every tick. */
export function Floor({ view, onPick, demoLabel }: { view: FloorView; onPick: (apptId: string) => void; demoLabel: string | null }) {
  const host = useRef<HTMLDivElement | null>(null);
  const scene = useRef<SalonScene | null>(null);
  const pick = useRef(onPick);
  pick.current = onPick;

  useEffect(() => {
    if (!host.current) return;
    let stage: Stage;
    try {
      stage = new Stage(host.current, { camera: OVERVIEW.camera, target: OVERVIEW.target, intro: [16, 19, 25], fov: 30, minDistance: 8, maxDistance: 32, maxPolarAngle: 1.25, fitAspect: 1.75, sway: 0.1 });
    } catch {
      return;
    }
    scene.current = new SalonScene(stage, (id) => id && pick.current(id));
    return () => {
      scene.current?.dispose();
      scene.current = null;
      stage.dispose();
    };
  }, []);

  useEffect(() => {
    scene.current?.update(view);
  }, [view]);

  const taken = view.chairs.filter((c) => c.appt).length;
  return (
    <div className="floor glass" ref={host}>
      <div className="floor-head">
        <div>
          <div className="kicker">Nu op de vloer{demoLabel ? ` · ${demoLabel}` : ''}</div>
          <h2>
            {taken} van {view.chairs.filter((c) => c.stylist).length} stoelen bezet
          </h2>
        </div>
        <div className="floor-legend">
          <span>
            <i style={{ background: '#FF5C93' }} /> via de app
          </span>
          <span>
            <i style={{ background: '#FFC24B' }} /> inwerktijd
          </span>
          <span>
            <i style={{ background: '#5E6796' }} /> vrij
          </span>
        </div>
      </div>
    </div>
  );
}
