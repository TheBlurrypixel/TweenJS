/*
* Timeline
* Visit http://createjs.com/ for documentation, updates and examples.
*
* Copyright (c) 2010 gskinner.com, inc.
*
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
*
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * @module TweenJS
 */

// namespace:
this.createjs = this.createjs||{};


(function() {
	"use strict";
	

// constructor	
	/**
	 * The Timeline class synchronizes multiple tweens and allows them to be controlled as a group. Please note that if a
	 * timeline is looping, the tweens on it may appear to loop even if the "loop" property of the tween is false.
	 * 
	 * NOTE: Timeline currently also accepts a param list in the form: `tweens, labels, props`. This is for backwards
	 * compatibility only and will be removed in the future. Include tweens and labels as properties on the props object.
	 * @class Timeline
	 * @param {Object} [props] The configuration properties to apply to this instance (ex. `{loop:-1, paused:true}`).
	 * Supported props are listed below. These props are set on the corresponding instance properties except where
	 * specified.<UL>
	 *    <LI> `useTicks`</LI>
	 *    <LI> `ignoreGlobalPause`</LI>
	 *    <LI> `loop`</LI>
	 *    <LI> `reversed`</LI>
	 *    <LI> `bounce`</LI>
	 *    <LI> `timeScale`</LI>
	 *    <LI> `paused`</LI>
	 *    <LI> `position`: indicates the initial position for this tween.</LI>
	 *    <LI> `onChange`: adds the specified function as a listener to the `change` event</LI>
	 *    <LI> `onComplete`: adds the specified function as a listener to the `complete` event</LI>
	 * </UL>
	 * @extends AbstractTween
	 * @constructor
	 **/
	function Timeline(props) {
		var tweens, labels;
		// handle old params (tweens, labels, props):
		// TODO: deprecated.
		if (props instanceof Array || (props == null && arguments.length > 1)) {
			tweens = props;
			labels = arguments[1];
			props = arguments[2];
		} else if (props) {
			tweens = props.tweens;
			labels = props.labels;
		}
		
		this.AbstractTween_constructor(props);

	// private properties:
		/**
		 * The array of tweens in the timeline. It is *strongly* recommended that you use
		 * {{#crossLink "Tween/addTween"}}{{/crossLink}} and {{#crossLink "Tween/removeTween"}}{{/crossLink}},
		 * rather than accessing this directly, but it is included for advanced uses.
		 * @property tweens
		 * @type Array
		 **/
		this.tweens = [];
		
		if (tweens) { this.addTween.apply(this, tweens); }
		this.setLabels(labels);
		
		this._init(props);
	};
	
	var p = createjs.extend(Timeline, createjs.AbstractTween);

	
// events:
	// docced in AbstractTween.


// public methods:
	/**
	 * Adds one or more tweens (or timelines) to this timeline. The tweens will be paused (to remove them from the
	 * normal ticking system) and managed by this timeline. Adding a tween to multiple timelines will result in
	 * unexpected behaviour.
	 * @method addTween
	 * @param {Tween} ...tween The tween(s) to add. Accepts multiple arguments.
	 * @return {Tween} The first tween that was passed in.
	 **/
	p.addTween = function(tween) {
		if (tween._parent) { tween._parent.removeTween(tween); }
		
		var l = arguments.length;
		if (l > 1) {
			for (var i=0; i<l; i++) { this.addTween(arguments[i]); }
			return arguments[l-1];
		} else if (l === 0) { return null; }
		
		this.tweens.push(tween);
		tween._parent = this;
		tween.paused = true;
		var d = tween.duration;
		if (tween.loop > 0) { d *= tween.loop+1; }
		if (d > this.duration) { this.duration = d; }
		
		if (this.rawPosition >= 0) { tween.setPosition(this.rawPosition); }
		return tween;
	};

	/**
	 * Removes one or more tweens from this timeline.
	 * @method removeTween
	 * @param {Tween} ...tween The tween(s) to remove. Accepts multiple arguments.
	 * @return Boolean Returns `true` if all of the tweens were successfully removed.
	 **/
	p.removeTween = function(tween) {
		var l = arguments.length;
		if (l > 1) {
			var good = true;
			for (var i=0; i<l; i++) { good = good && this.removeTween(arguments[i]); }
			return good;
		} else if (l === 0) { return true; }

		var tweens = this.tweens;
		var i = tweens.length;
		while (i--) {
			if (tweens[i] === tween) {
				tweens.splice(i, 1);
				tween._parent = null;
				if (tween.duration >= this.duration) { this.updateDuration(); }
				return true;
			}
		}
		return false;
	};

	/**
	 * Recalculates the duration of the timeline. The duration is automatically updated when tweens are added or removed,
	 * but this method is useful if you modify a tween after it was added to the timeline.
	 * @method updateDuration
	 **/
	p.updateDuration = function() {
		this.duration = 0;
		for (var i=0,l=this.tweens.length; i<l; i++) {
			var tween = this.tweens[i];
			var d = tween.duration;
			if (tween.loop > 0) { d *= tween.loop+1; }
			if (d > this.duration) { this.duration = d; }
		}
	};

	/**
	* Returns a string representation of this object.
	* @method toString
	* @return {String} a string representation of the instance.
	**/
	p.toString = function() {
		return "[Timeline]";
	};

	/**
	 * @method clone
	 * @protected
	 **/
	p.clone = function() {
		throw("Timeline can not be cloned.")
	};

// private methods:
	
	// Docced in AbstractTween
	p._updatePosition = function(jump, end) {
		var t = this.position;
		for (var i=0, l=this.tweens.length; i<l; i++) {
			this.tweens[i].setPosition(t, true, jump); // actions will run after all the tweens update.
		}
	};
	
	// Docced in AbstractTween
	p._runActionsRange = function(startPos, endPos, jump, includeStart) {
		//console.log("	range", startPos, endPos, jump, includeStart);
		var t = this.position;
		for (var i=0, l=this.tweens.length; i<l; i++) {
			this.tweens[i]._runActions(startPos, endPos, jump, includeStart);
			if (t !== this.position) { return true; } // an action changed this timeline's position.
		}
	};

	/**
	 * Advances the tween to a specified position.
	 * 
	 * BEGIN modifications to fix MCs getting paused when timeline completes and to be paused on single frame MCs
	 * below is part of a fix to make sure that MC gets paused when timeline completes
	 * and modification to fix getBounds returning error if nominal bounds is null and causes
	 * first frame of frameBounds to be null getting through and causing error
	 * @method setPosition
	 * @param {Number} rawPosition The raw position to seek to in milliseconds (or ticks if useTicks is true).
	 * @param {Boolean} [ignoreActions=false] If true, do not run any actions that would be triggered by this operation.
	 * @param {Boolean} [jump=false] If true, only actions at the new position will be run. If false, actions between the old and new position are run.
	 * @param {Function} [callback] Primarily for use with MovieClip, this callback is called after properties are updated, but before actions are run.
	 */
	p.setPosition = function(rawPosition, ignoreActions, jump, callback) {
		var d=this.duration, loopCount=this.loop, prevRawPos = this.rawPosition;
		var loop=0, t=0, end=false;
		
		// normalize position:
		if (rawPosition < 0) { rawPosition = 0; }
		
		if (d === 0) {
			// deal with 0 length tweens.
			end = true;
			if (prevRawPos !== -1) { return end; } // we can avoid doing anything else if we're already at 0.
		} else {
			loop = rawPosition/d|0;
			t = rawPosition-loop*d;
			
			end = (loopCount !== -1 && rawPosition >= loopCount*d+d);
			if (end) { rawPosition = (t=d)*(loop=loopCount)+d; }
			if (rawPosition === prevRawPos) { return end; } // no need to update
			
			var rev = !this.reversed !== !(this.bounce && loop%2); // current loop is reversed
			if (rev) { t = d-t; }
		}
		
		// set this in advance in case an action modifies position:
		this.position = t;
		this.rawPosition = rawPosition;
		
		this._updatePosition(jump, end);

		// add _end flag to signify to MC during the callback to set paused
		if (end) {
			this.paused = true; 
			this._end = true;
		}
		else
			this._end = undefined;

		callback&&callback(this);
		
		if (!ignoreActions) { this._runActions(prevRawPos, rawPosition, jump, !jump && prevRawPos === -1); }
		
		this.dispatchEvent("change");
		if (end) { this.dispatchEvent("complete"); }
	};
	
	createjs.Timeline = createjs.promote(Timeline, "AbstractTween");

}());
