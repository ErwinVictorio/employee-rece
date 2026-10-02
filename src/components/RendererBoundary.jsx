import { Component } from 'react';

export class RendererBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() {
    return this.state.failed ? <section className="panel race-hud" role="alert"><p>The 3D renderer could not load. Your event is paused and saved. Check that hardware acceleration and WebGL are available.</p><button className="primary" onClick={() => this.setState({ failed: false })}>Retry 3D</button></section> : this.props.children;
  }
}
