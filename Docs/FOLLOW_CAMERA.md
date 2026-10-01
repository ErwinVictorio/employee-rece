# Moving-track presentation

The normal stadium and trackside cameras follow the midpoint between the leading and trailing runners. The fitted full-track camera is translated along the track, keeping the whole field in view while the stationary scenery appears to pass backwards.

The countdown stays in the original view. Follow strength eases in over the first 1.5 seconds of racing. The existing 75% final-stretch trigger blends this moving view into Finish Cam over 0.8 seconds. Manual camera controls still work. Reduced motion disables follow movement. Camera positions sample the shared race clock, so pause, context recovery and replay do not introduce drift.

Runner progress, track geometry, finish line, winner selection and finish times are unchanged. No extra meshes, textures or animation timers are added.

Verification: focused follow/finish camera tests, ESLint, production build and browser checks for camera travel, pause, mobile runner framing, reduced motion and finish handoff. Browser screenshot: `artifacts/3d-camera-follow.png`.
