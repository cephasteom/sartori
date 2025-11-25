import { Gain, Split, Merge, getDestination } from 'tone'
import Synth from './ct-synths/tone/Synth'

const console = new BroadcastChannel('sartori');

const destination = getDestination() // system audio output
destination.channelCount = destination.maxChannelCount // set to max channels

const output = new Merge({channels: destination.maxChannelCount}) // create output merger
output.connect(destination) // connect to system audio output

const instMap: Record<string, typeof Synth> = {
    'tone.synth': Synth,
}

/**
 * Represents an audio channel with its own instruments and effects.
 */
export class Channel {
    out: number // output channel index
    input: Gain // input gain
    output: Split // output splitter
    fader: Gain // volume control
    instruments: Record<string, any> = {}
    
    constructor(out: number = 0) {
        this.out = out

        this.input = new Gain(1)
        this.fader = new Gain(1)
        this.output = new Split({channels: 2})
        
        this.fader.connect(this.output)
        this.input.fan(this.fader)
        
        this.output.connect(output, 0, out)
        this.output.connect(output, 1, out+1)
    }

    /**
     * Plays an instrument with given params at given time
     * @param params - e.g. {inst: 'tone.synth', n: 60, dur: 1000}
     * @param time 
     */
    play(params: any, time: number) {
        const { inst } = params;

        // check that instrument is valid
        if(!Object.keys(instMap).includes(inst)) {
            return console.postMessage({ 
                type: 'error', 
                message: `Instrument type "${inst}" not recognised.` 
            });
        }

        // initialize instrument if it doesn't exist on this channel yet
        if(!this.instruments[inst]) {
            this.instruments[inst] = new instMap[inst]();
            this.instruments[inst].connect(this.input);
        }

        // play instrument with given params
        this.instruments[inst].play(params, time);
    }
}