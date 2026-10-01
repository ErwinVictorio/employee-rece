import { Component } from 'react';

export class RendererBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() {
    return this.state.failed ? <section className="panel race-hud" role="alert"><p>The 3D renderer could not load. Your race is saved.</p><button className="primary" onClick={this.props.onFallback}>Resume in 2D</button></section> : this.props.children;
  }
}
