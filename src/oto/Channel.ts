import { Gain, Split, Merge, getDestination, Limiter } from 'tone'
import Synth from './ct-synths/rnbo/Synth'
import Sampler from './ct-synths/rnbo/Sampler2'
import Granular from './ct-synths/rnbo/Granular2';
import AcidSynth from './ct-synths/rnbo/AcidSynth';
import TSynth from './ct-synths/tone/Synth'
import TMono from './ct-synths/tone/MonoSynth'
import TFM from './ct-synths/tone/FMSynth'
import TAM from './ct-synths/tone/AMSynth'
import FXChannel from './ct-synths/rnbo/FXChannel';
import FXDelay from './ct-synths/rnbo/Delay';
import ReverbGen from './ct-synths/rnbo/ReverbGen';

import { samples } from './samples';

const sartori = new BroadcastChannel('sartori');

const destination = getDestination() // system audio output
destination.channelCount = destination.maxChannelCount // set to max channels

const output = new Merge({channels: destination.maxChannelCount}) // create output merger
output.connect(destination) // connect to system audio output

declare type Instrument = typeof Synth | typeof Sampler | typeof Granular | typeof AcidSynth | typeof TSynth | typeof TMono | typeof TFM | typeof TAM

const instMap: Record<string, Instrument> = {
    'synth': Synth,
    'sampler': Sampler,
    'granular': Granular,
    'acid': AcidSynth,
    'tone.synth': TSynth,
    'tone.mono': TMono,
    'tone.fm': TFM,
    'tone.am': TAM,
}

/**
 * Represents an audio channel with its own instruments and effects.
 */
export class Channel {
    out: number| null = null  // output channel index
    _input: Gain // input gain
    _output: Split // output splitter
    _limiter: Limiter
    _instruments: Record<string, any> = {}
    _fx: any
    _reverb: any
    _delay: any
    _fader: Gain // volume control
    
    constructor(out: number = 0) {

        this._input = new Gain(1)
        this._fader = new Gain(1)
        this._output = new Split({channels: 2})
        this._limiter = new Limiter(-10)
        
        this._limiter.connect(this._output)
        this._fader.connect(this._limiter)
        this._input.fan(this._fader)
        
        this.routeOutput(out)
    }

    /**
     * Routes channel output to given output index
     * @param out 
     */
    routeOutput(out: number) {
        if(out === this.out) return

        this._output.disconnect()

        try {
            this._output.connect(output, 0, out)
            this._output.connect(output, 1, out+1)
            this.out = out
        } catch (e) {
            sartori.postMessage({ 
                type: 'error', 
                message: `Output channel ${out} is not available on this system.` 
            });
            // revert to previous output
            this._output.connect(output, 0, 0)
            this._output.connect(output, 1, 1)
            this.out = 0
        }
    };

    /**
     * Initializes FX channel on this channel. Then handles internal routing.
     */
    initFX() {
        this._fx = new FXChannel()
        this._handleInternalRouting()
    }

    /**
     * Initializes Delay effect on this channel. Then handles internal routing.
     */
    initDelay() {
        this._delay = new FXDelay()
        this._handleInternalRouting()
    }

    /**
     * Initializes Reverb effect on this channel. Then handles internal routing.
     */
    initReverb() {
        this._reverb = new ReverbGen()
        this._handleInternalRouting()
    }

    /**
     * Handles internal routing of input -> fx -> _fader
     */
    _handleInternalRouting() {
        const { _fx, _reverb, _delay, _input, _fader } = this
        const fx = [_fx, _delay, _reverb]
        
        // disconnect chain
        fx.forEach(fx => fx && fx.disconnect())
        _input.disconnect()
        // this._input.fan(...this._busses, ...this._fxBusses)

        const first = fx.find(Boolean)
        const last = [...fx].reverse().find(Boolean)
        
        _input.connect(first?.input || _fader)
        last?.connect(_fader)

        fx.filter(Boolean).reduce((prev, curr) => {
            prev && curr && prev.connect(curr.input)
            return curr
        }, null)
    }

    /**
     * Plays an instrument with given params at given time
     * @param params - e.g. {inst: 'tone.synth', n: 60, dur: 1000}
     * @param time 
     */
    play(params: any, time: number) {
        const { inst, level = 1 } = params;
        params.out && this.routeOutput(params.out);

        // check that instrument is valid
        if(!Object.keys(instMap).includes(inst)) {
            return sartori.postMessage({ 
                type: 'error', 
                message: `Instrument type "${inst}" not recognised.` 
            });
        }

        // initialize instrument if it doesn't exist on this channel yet
        if(!this._instruments[inst]) {
            this._instruments[inst] = new instMap[inst]();
            this._instruments[inst].connect(this._input);
            this._instruments[inst].banks = samples; // provide samples if applicable
        }

        // play instrument with given params
        this._instruments[inst].play(params, time);

        // handle fx params
        this.handleFx(params, time);

        // set channel level
        this._fader.gain.rampTo(level, 0.1, time)
    }

    /**
     * Handles FX parameters for this channel. Initializes FX modules as they are requested.
     * @param params - e.g. {dist: 0.5, reverb: 0.3, level: 0.8}
     * @param time 
     */
    handleFx(params: any, time: number) {
        // extract fx params
        const { dist = 0, ring = 0, chorus = 0, lpf = 0, hpf = 0 } = params;
        
        // if any fx params are > 0, initialize fx if not already done
        !this._fx
        && [dist, ring, chorus, lpf, hpf].reduce((a, b) => a + b, 0) > 0 
        && this.initFX()

        // initialize reverb / delay if needed
        params.reverb > 0 && !this._reverb && this.initReverb()
        params.delay > 0 && !this._delay && this.initDelay()

        // set fx params
        this._fx && this._fx.set(params, time)
        this._reverb && this._reverb.set(params, time)
        this._delay && this._delay.set(params, time)
    }

    /**
     * Mutate all instruments on this channel with given params
     * @param params - e.g {n: 72, modi: 10}
     */
    mutate(params: Record<string, any>, time: number) {
        Object.values(this._instruments).forEach(inst => {
            inst.mutate(params, time, params.lag || 100);
        });
    }

    /** 
     * Cut all instruments on this channel
     */
    cut(time: number) {
        Object.values(this._instruments).forEach(inst => {
            inst.cut(time);
        });
    }
}