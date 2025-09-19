/* 
  *** Enhanced APEX Item & Region State Manager *** 
  * Version: 4.2
  * Integrated layout management and maintained legacy compatibility.
  
  ** DOCUMENTATION: https://github.com/andreiluizf/oracleapex/blob/main/setState_documentation.md
*/

(function(window, $) {
    "use strict";

    // === CONSTANTS === 
    const FOCUSABLE_SEL = "a[href], area[href], input:not([type=hidden]), select, textarea, button, iframe, object, embed, [contenteditable], [tabindex]:not([tabindex=\"-1\"])";
    const REGION_WRAP   = ".t-Region, .a-Region, .js-regionContainer, .t-IRR-region, .t-Report-region, .t-ContentBlock";
    const COL_WRAP      = ".col, [class*=\"col-\"], .t-Region-col, .apex-col";
    
    // === PRIVATE UTILITY FUNCTIONS ===
    
    function $region(idOrNode) {
        let $el = (idOrNode && idOrNode.jquery) ? idOrNode : $("#" + idOrNode);
        if (!$el.length) return $();
        
        try {
            const vo_region = apex.region(idOrNode);
            if (vo_region && typeof vo_region.widget === "function") {
                const $widget = vo_region.widget();
                if ($widget && $widget.length) {
                    return $widget.closest(REGION_WRAP);
                }
            }
        } catch(e) { /* fallback to DOM */ }
        
        let $wr = $el.closest(REGION_WRAP);
        return $wr.length ? $wr : $el;
    }
    
    function _asArray(x) {
        return Array.isArray(x) ? x : [x];
    }

    function _handleDatePickerLock($fc, itemName, lock) {
        const $displayField = $("#" + itemName + "_DISPLAY");
        
        if (lock) {
            if ($displayField.length) {
                if ($displayField.data("orig-readonly") === undefined) {
                    $displayField.data("orig-readonly", $displayField.prop("readonly"));
                }
                $displayField.prop("readonly", true).attr("tabindex", "-1");
            }
            
            $fc.find(".a-Button--calendar, .ui-datepicker-trigger").each(function() {
                const $btn = $(this);
                if ($btn.data("orig-disabled") === undefined) {
                    $btn.data("orig-disabled", $btn.prop("disabled"));
                }
                $btn.prop("disabled", true);
            });

            $fc.on("click.apxDateLock", ".a-Button--calendar, .ui-datepicker-trigger", function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
            });
        } else {
            $fc.off(".apxDateLock");
            
            if ($displayField.length) {
                const vb_origReadonly = $displayField.data("orig-readonly");
                if (vb_origReadonly !== undefined) {
                    $displayField.prop("readonly", vb_origReadonly);
                    $displayField.removeData("orig-readonly");
                }
            }
            
            $fc.find(".a-Button--calendar, .ui-datepicker-trigger").each(function() {
                const $btn = $(this);
                const vb_origDisabled = $btn.data("orig-disabled");
                if (vb_origDisabled !== undefined) {
                    $btn.prop("disabled", vb_origDisabled);
                    $btn.removeData("orig-disabled");
                }
                $btn.removeAttr("aria-disabled");
            });
        }
    }

    function _animateColumnResize($col, newState, config) {
        if (!$col.length) return;

        if (!$col.hasClass("apx-column-transition")) {
            $col.addClass("apx-column-transition")
                .css("transition", `all ${config.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`);
        }

        if (newState === "hide") {
            $col.fadeOut(config.animationDuration);
        } else {
            $col.removeClass(function(index, className) {
                return (className.match(/col-\d+/g) || []).join(" ");
            }).addClass(newState);
            
            if ($col.is(":hidden")) {
                $col.fadeIn(config.animationDuration);
            }
        }
    }

    // === MAIN setState OBJECT ===
    const setState = {
        
        item: function(items, opts = {}) {
            const vo_config = {
                clearOnHide: false,
                collapseExpand: false,
                collapseSize: "col-6",
                expandSize: "col-12",
                animationDuration: 300,
                ...opts
            };
            
            const va_items = _asArray(items);

            va_items.forEach(vs_id => {
                if (!vs_id) return;
                
                const $fc = $("#" + vs_id).closest(".t-Form-fieldContainer, .a-Form-fieldContainer");
                if (!$fc.length) return;

                if (!$fc.data("apx-original-state")) {
                    $fc.data("apx-original-state", {
                        hidden: $fc.is(":hidden"),
                        locked: $fc.hasClass("apex-lock"),
                        required: $fc.hasClass("is-required")
                    });
                }

                if (vo_config.collapseExpand && vo_config.expandTarget) {
                    setState.private._handleItemCollapseExpand(vs_id, vo_config.expandTarget, vo_config);
                }

                const vb_hasHidden = "hidden" in opts;
                const vb_hasLocked = "locked" in opts;
                const vb_hasRequired = "required" in opts;
                
                if (vb_hasHidden) {
                    setState.private._setHidden(vs_id, !!opts.hidden, !!vo_config.clearOnHide);
                    if (opts.hidden === true && !vb_hasRequired) {
                        setState.private._setRequired(vs_id, false);
                    }
                }
                
                if (vb_hasLocked) {
                    setState.private._setLocked(vs_id, !!opts.locked);
                }
                
                if (vb_hasRequired) {
                    setState.private._setRequired(vs_id, !!opts.required);
                }
                
                if (typeof vo_config.onStateChange === "function") {
                    vo_config.onStateChange(vs_id, setState.get.item(vs_id));
                }
            });
            
            return setState;
        },

        region: function(ids, opts = {}) {
            const vo_config = {
                collapseColumn: true,
                clearOnHide: false,
                centerIcon: false,
                collapseExpand: false,
                collapseSize: "col-6",
                expandSize: "col-12",
                animationDuration: 300,
                ...opts
            };

            const va_regions = _asArray(ids);

            va_regions.forEach(vs_id => {
                const $wr = $region(vs_id);
                if (!$wr.length) return;

                if (!$wr.data("apx-original-state")) {
                    $wr.data("apx-original-state", {
                        hidden: $wr.hasClass("apex-region-hidden"),
                        locked: $wr.hasClass("apex-region-locked"),
                        columnClass: $wr.closest(COL_WRAP).attr("class")
                    });
                }

                if (vo_config.collapseExpand && vo_config.expandTarget) {
                    setState.private._handleRegionCollapseExpand(vs_id, vo_config.expandTarget, vo_config);
                }

                const vb_hasHidden = "hidden" in opts;
                const vb_hasLocked = "locked" in opts;

                if (vb_hasHidden) {
                    setState.private._setRegionHidden(vs_id, !!opts.hidden, {
                        collapseColumn: vo_config.collapseColumn,
                        clearOnHide: vo_config.clearOnHide,
                        clearFn: vo_config.clearFn
                    });
                }

                if (vb_hasLocked && !(opts.hidden === true)) {
                    setState.private._setRegionLocked(vs_id, !!opts.locked, { 
                        centerIcon: vo_config.centerIcon 
                    });
                }

                if (typeof vo_config.onStateChange === "function") {
                    vo_config.onStateChange(vs_id, setState.get.region(vs_id));
                }
            });
            
            return setState;
        },

        batch: {
            items: function(operations) {
                Object.entries(operations).forEach(([vs_id, vo_config]) => {
                    setState.item(vs_id, vo_config);
                });
                return setState;
            },

            regions: function(operations) {
                Object.entries(operations).forEach(([vs_id, vo_config]) => {
                    setState.region(vs_id, vo_config);
                });
                return setState;
            }
        },

        get: {
            item: function(itemId) {
                const $fc = $("#" + itemId).closest(".t-Form-fieldContainer, .a-Form-fieldContainer");
                return {
                    hidden: $fc.is(":hidden"),
                    locked: $fc.hasClass("apex-lock"),
                    required: $fc.hasClass("is-required"),
                    disabled: $fc.attr("aria-disabled") === "true",
                    exists: $fc.length > 0
                };
            },

            region: function(regionId) {
                const $wr = $region(regionId);
                return {
                    hidden: $wr.hasClass("apex-region-hidden"),
                    locked: $wr.hasClass("apex-region-locked"),
                    disabled: $wr.attr("aria-disabled") === "true",
                    exists: $wr.length > 0
                };
            }
        },

        toggle: {
            item: function(itemId, property) {
                const vo_currentState = setState.get.item(itemId);
                if (!vo_currentState.exists) return setState;
                
                setState.item(itemId, { [property]: !vo_currentState[property] });
                return setState;
            },

            region: function(regionId, property) {
                const vo_currentState = setState.get.region(regionId);
                if (!vo_currentState.exists) return setState;
                
                setState.region(regionId, { [property]: !vo_currentState[property] });
                return setState;
            }
        },

        hide: {
            item: function(itemId, opts = {}) { return setState.item(itemId, { hidden: true, ...opts }); },
            region: function(regionId, opts = {}) { return setState.region(regionId, { hidden: true, ...opts }); }
        },

        show: {
            item: function(itemId, opts = {}) { return setState.item(itemId, { hidden: false, ...opts }); },
            region: function(regionId, opts = {}) { return setState.region(regionId, { hidden: false, ...opts }); }
        },

        lock: {
            item: function(itemId, opts = {}) { return setState.item(itemId, { locked: true, ...opts }); },
            region: function(regionId, opts = {}) { return setState.region(regionId, { locked: true, ...opts }); }
        },

        unlock: {
            item: function(itemId, opts = {}) { return setState.item(itemId, { locked: false, ...opts }); },
            region: function(regionId, opts = {}) { return setState.region(regionId, { locked: false, ...opts }); }
        },

        require: {
            item: function(itemId, opts = {}) { return setState.item(itemId, { required: true, ...opts }); }
        },

        unrequire: {
            item: function(itemId, opts = {}) { return setState.item(itemId, { required: false, ...opts }); }
        },

        restore: {
            item: function(items) {
                const va_items = _asArray(items);
                va_items.forEach(vs_id => {
                    const $fc = $("#" + vs_id).closest(".t-Form-fieldContainer, .a-Form-fieldContainer");
                    const vo_originalState = $fc.data("apx-original-state");
                    if (!vo_originalState) return;
                    setState.item(vs_id, vo_originalState);
                    $fc.removeData("apx-original-state");
                });
                return setState;
            },

            region: function(regions) {
                const va_regions = _asArray(regions);
                va_regions.forEach(vs_id => {
                    const $wr = $region(vs_id);
                    const vo_originalState = $wr.data("apx-original-state");
                    if (!vo_originalState) return;
                    setState.region(vs_id, vo_originalState);
                    $wr.removeData("apx-original-state");
                });
                return setState;
            },
            layout: function(sourceId, targetId) {
                const $sourceCol = $region(sourceId).closest(COL_WRAP);
                const $targetCol = $region(targetId).closest(COL_WRAP);

                const sourceOrig = $sourceCol.data("apx-original-classes");
                if (sourceOrig != null) $sourceCol.attr("class", sourceOrig);

                const targetOrig = $targetCol.data("apx-original-classes");
                if (targetOrig != null) $targetCol.attr("class", targetOrig);

                if ($sourceCol.data("apx-original-classes")) {
                    $sourceCol.removeData("apx-original-classes");
                }
                if ($targetCol.data("apx-original-classes")) {
                    $targetCol.removeData("apx-original-classes");
                }

                $sourceCol.add($targetCol)
                    .removeClass("apx-column-transition apx-col-expanding apx-col-collapsing")
                    .css("transition", "");
                    
                return setState;
            }
        },

        snapshot: {
            create: function(itemIds = [], regionIds = []) {
                const vo_snapshot = { timestamp: new Date().toISOString(), items: {}, regions: {} };
                itemIds.forEach(vs_id => { vo_snapshot.items[vs_id] = setState.get.item(vs_id); });
                regionIds.forEach(vs_id => { vo_snapshot.regions[vs_id] = setState.get.region(vs_id); });
                return vo_snapshot;
            },

            restore: function(snapshot) {
                if (snapshot.items) {
                    Object.entries(snapshot.items).forEach(([vs_id, vo_state]) => { setState.item(vs_id, vo_state); });
                }
                if (snapshot.regions) {
                    Object.entries(snapshot.regions).forEach(([vs_id, vo_state]) => { setState.region(vs_id, vo_state); });
                }
                return setState;
            }
        },

        conditional: function(conditions) {
            Object.entries(conditions).forEach(([vs_itemId, vo_rules]) => {
                const vo_item = apex.item(vs_itemId);
                if (!vo_item) return;

                vo_item.callbacks.change = function() {
                    const vs_value = vo_item.getValue();
                    vo_rules.forEach(vo_rule => {
                        const vb_match = vo_rule.operator === "=" 
                            ? vs_value == vo_rule.value
                            : vo_rule.operator === "!=" 
                            ? vs_value != vo_rule.value
                            : vo_rule.operator === "contains"
                            ? vs_value.includes(vo_rule.value)
                            : vo_rule.operator === "empty"
                            ? vs_value === ""
                            : vo_rule.operator === "notEmpty"
                            ? vs_value !== ""
                            : false;
                        
                        if (vb_match && vo_rule.actions) {
                            vo_rule.actions.forEach(vo_action => {
                                if (vo_action.type === "item") {
                                    setState.item(vo_action.target, vo_action.state);
                                } else if (vo_action.type === "region") {
                                    setState.region(vo_action.target, vo_action.state);
                                }
                            });
                        }
                    });
                };
            });
            return setState;
        },

        layout: {
            collapseExpand: function(item1, collapseSizeOrHide, item2, expandSize, opts) {
                opts = opts || {};
                var _COL_WRAP  = opts.colSelector || COL_WRAP;
                var ANIMATE   = !!opts.animate;
                var DURATION  = Number.isFinite(opts.duration) ? opts.duration : 250;
                var EASING    = opts.easing || "ease";

                function getColByStaticId(staticId) {
                    if (!staticId) return $();
                    var $node = $("#" + staticId);
                    if (!$node.length) $node = $("[id=\"" + staticId + "\"]");
                    return $node.closest(_COL_WRAP);
                }

                var hide1 = (collapseSizeOrHide === true || String(collapseSizeOrHide).toLowerCase() === "hide");
    
                // Se a opção clearOnHide for passada e o item1 estiver sendo escondido
                if (opts && opts.clearOnHide && hide1) {
                  try {
                    apex.item(item1).setValue("");
                  } catch(e) {
                    console.error("setState.layout.collapseExpand: Falha ao limpar o item " + item1, e);
                  }
                }

                function toCol(size) {
                    var n = parseInt(size, 10);
                    return (Number.isInteger(n) && n >= 1 && n <= 12) ? ("col-" + n) : null;
                }

                function stripColClasses($el) {
                    $el.removeClass(function(i, c) {
                        var m = c && c.match(/(?:^|\s)col-\d+(?=\s|$)/g);
                        return m ? m.join(" ") : "";
                    });
                }

                function ensureSaved($el) {
                    if (!$el.length) return;
                    if (!$el.data("apx-original-classes")) {
                        $el.data("apx-original-classes", $el.attr("class") || "");
                    }
                }

                function restoreSaved($el) {
                    if (!$el.length) return;
                    var orig = $el.data("apx-original-classes");
                    if (orig != null) $el.attr("class", orig);
                }

                function animateWidth($el, mutateToTarget) {
                    if (!ANIMATE || !$el.length) { mutateToTarget(); return Promise.resolve(); }
                    var el = $el[0];
                    var startW = el.getBoundingClientRect().width;
                    el.style.width = startW + "px";
                    el.style.transition = "none";
                    el.offsetHeight;
                    mutateToTarget();
                    var endW = el.getBoundingClientRect().width;
                    el.style.transition = "width " + DURATION + "ms " + EASING;
                    el.style.width = endW + "px";
                    return new Promise(function(resolve) {
                        var done = function(ev) {
                            if (ev && ev.propertyName !== "width") return;
                            el.removeEventListener("transitionend", done);
                            el.style.transition = "";
                            el.style.width = "";
                            resolve();
                        };
                        el.addEventListener("transitionend", done);
                        setTimeout(done, DURATION + 20);
                    });
                }

                function animateHide($el) {
                    if (!ANIMATE || !$el.length) { $el.hide(); return Promise.resolve(); }
                    return new Promise(function(resolve) {
                        var el = $el[0];
                        var startH = el.scrollHeight;
                        el.style.overflow = "hidden";
                        el.style.height = startH + "px";
                        el.style.opacity = "1";
                        el.style.transition = "none";
                        el.offsetHeight;
                        el.style.transition = "height " + DURATION + "ms " + EASING + ", opacity " + DURATION + "ms " + EASING;
                        el.style.height = "0px";
                        el.style.opacity = "0";
                        var done = function() {
                            el.removeEventListener("transitionend", done);
                            $el.hide();
                            el.style.transition = "";
                            el.style.height = "";
                            el.style.opacity = "";
                            el.style.overflow = "";
                            resolve();
                        };
                        el.addEventListener("transitionend", done);
                        setTimeout(done, DURATION + 20);
                    });
                }

                function animateShow($el) {
                    if (!ANIMATE || !$el.length) { $el.show(); return Promise.resolve(); }
                    return new Promise(function(resolve) {
                        var el = $el[0];
                        $el.show();
                        var endH = el.scrollHeight;
                        el.style.overflow = "hidden";
                        el.style.height = "0px";
                        el.style.opacity = "0";
                        el.style.transition = "none";
                        el.offsetHeight;
                        el.style.transition = "height " + DURATION + "ms " + EASING + ", opacity " + DURATION + "ms " + EASING;
                        el.style.height = endH + "px";
                        el.style.opacity = "1";
                        var done = function() {
                            el.removeEventListener("transitionend", done);
                            el.style.transition = "";
                            el.style.height = "";
                            el.style.opacity = "";
                            el.style.overflow = "";
                            resolve();
                        };
                        el.addEventListener("transitionend", done);
                        setTimeout(done, DURATION + 20);
                    });
                }

                var $col1 = getColByStaticId(item1);
                var $col2 = getColByStaticId(item2);

                if (!$col1.length || !$col2.length) {
                    return { ok: false, details: { reason: "Column wrapper not found for one or both items", item1Found: !!$col1.length, item2Found: !!$col2.length } };
                }

                ensureSaved($col1);
                ensureSaved($col2);

                var hide1 = (collapseSizeOrHide === true || String(collapseSizeOrHide).toLowerCase() === "hide");
                var size1 = hide1 ? null : toCol(collapseSizeOrHide);
                var size2 = toCol(expandSize);

                var m1 = function mutateCol1() {
                    if (size1) {
                        stripColClasses($col1);
                        $col1.addClass(size1);
                    } else if (!hide1) {
                        restoreSaved($col1);
                    }
                };

                var m2 = function mutateCol2() {
                    if (size2) {
                        stripColClasses($col2);
                        $col2.addClass(size2);
                    } else {
                        restoreSaved($col2);
                    }
                };

                var p = Promise.resolve();

                if (hide1) {
                    p = p.then(function() { return animateHide($col1); })
                         .then(function() { return animateWidth($col2, m2); });
                } else {
                    p = p.then(function() { 
                           return Promise.all([
                             animateShow($col1).then(function() { return animateWidth($col1, m1); }),
                             animateWidth($col2, m2)
                           ]);
                         });
                }

                p.catch(function(){ /* swallow */ });

                return {
                    ok: true,
                    details: {
                        animating: ANIMATE,
                        duration: DURATION,
                        easing: EASING
                    }
                };
            }
        },

        private: {
            _setLocked: function(itemNames, locked = true, options = {}) {
                const va_names = _asArray(itemNames);
                const vo_config = { hideValue: false, ...options };

                va_names.forEach(vs_itemName => {
                    const $fc = $("#" + vs_itemName).closest(".t-Form-fieldContainer, .a-Form-fieldContainer");
                    if (!$fc.length) return;

                    if (locked) {
                        if ($fc.css("position") === "static") $fc.css("position", "relative");
                        let vs_lockClasses = "apex-lock apex-state-changing";
                        if (vo_config.hideValue) {
                            vs_lockClasses += " apex-lock-hide-value";
                        }
                        $fc.addClass(vs_lockClasses).attr({"aria-disabled": "true", "inert": ""});

                        $fc.find(FOCUSABLE_SEL).each(function () {
                            const $el = $(this);
                            if ($el.data("orig-tabindex") === undefined) {
                                $el.data("orig-tabindex", $el.attr("tabindex"));
                            }
                            $el.attr("tabindex", "-1");

                            if ($el.is("input[type=\"text\"], input[type=\"number\"], input[type=\"date\"], input[type=\"time\"], input[type=\"email\"], input[type=\"url\"], textarea")) {
                                if ($el.data("orig-readonly") === undefined) {
                                    $el.data("orig-readonly", $el.prop("readonly"));
                                }
                                $el.prop("readonly", true);
                            }
                            
                            if ($el.is("button, input[type=\"button\"], input[type=\"submit\"], select")) {
                                if ($el.data("orig-disabled") === undefined) {
                                    $el.data("orig-disabled", $el.prop("disabled"));
                                }
                                $el.prop("disabled", true);
                            }
                        });

                        const vb_isDatePicker = $fc.find(".ui-datepicker-trigger, .a-Button--calendar").length > 0 || $("#" + vs_itemName + "_DISPLAY").length > 0 || $fc.hasClass("apex-item-datepicker");
                        if (vb_isDatePicker) {
                            _handleDatePickerLock($fc, vs_itemName, true);
                        }

                        const $active = $(document.activeElement);
                        if ($active.length && $active.closest($fc).length) {
                            $active.blur();
                            const $nextFocus = $(document.body).find(FOCUSABLE_SEL).filter(":visible:not([aria-disabled=\"true\"])").not($fc.find("*")).first();
                            if ($nextFocus.length) {
                                setTimeout(() => $nextFocus.focus(), 100);
                            }
                        }

                        $fc.on("focusin.apxLock keydown.apxLock click.apxLock", function (e) {
                            e.stopImmediatePropagation();
                            e.preventDefault();
                            if (e.type === "click") {
                                $fc.addClass("apex-attention");
                                setTimeout(() => $fc.removeClass("apex-attention"), 2000);
                            }
                        });

                        setTimeout(() => $fc.removeClass("apex-state-changing"), 200);

                    } else {
                        $fc.removeClass("apex-lock apex-lock-hide-value apex-state-changing apex-attention").removeAttr("aria-disabled inert");
                        const vb_isDatePicker = $fc.find(".ui-datepicker-trigger, .a-Button--calendar").length > 0 || $("#" + vs_itemName + "_DISPLAY").length > 0;
                        if (vb_isDatePicker) {
                            _handleDatePickerLock($fc, vs_itemName, false);
                        }

                        $fc.off(".apxLock");

                        $fc.find(FOCUSABLE_SEL + ", .a-Button--calendar, .js-menuButton, .ui-datepicker-trigger").each(function () {
                            const $el = $(this);
                            const vs_origTabindex = $el.data("orig-tabindex");
                            if (vs_origTabindex !== undefined) {
                                if (vs_origTabindex === null || vs_origTabindex === "") {
                                    $el.removeAttr("tabindex");
                                } else {
                                    $el.attr("tabindex", vs_origTabindex);
                                }
                                $el.removeData("orig-tabindex");
                            }

                            const vb_origReadonly = $el.data("orig-readonly");
                            if (vb_origReadonly !== undefined) {
                                $el.prop("readonly", vb_origReadonly);
                                $el.removeData("orig-readonly");
                            }

                            const vb_origDisabled = $el.data("orig-disabled");
                            if (vb_origDisabled !== undefined) {
                                $el.prop("disabled", vb_origDisabled);
                                $el.removeData("orig-disabled");
                            }
                            $el.removeAttr("aria-disabled");
                        });
                    }
                });
            },

            _setRequired: function(itemName, required) {
                const vb_req = !!required;
                const $base = $("#" + itemName);
                const $disp = $("#" + itemName + "_DISPLAY");
                const $fc = $base.closest(".t-Form-fieldContainer, .a-Form-fieldContainer");
                $fc.toggleClass("is-required", vb_req);

                const $radios = $fc.find("input[type=\"radio\"][name=\"" + itemName + "\"]");
                if ($radios.length) {
                    $radios.prop("required", false).removeAttr("aria-required");
                    if (vb_req) {
                        $radios.first().prop("required", true).attr("aria-required", "true");
                    }
                    return;
                }

                const $checks = $fc.find("input[type=\"checkbox\"][name=\"" + itemName + "\"]");
                if ($checks.length) {
                    $checks.prop("required", false).removeAttr("aria-required");
                    if (vb_req) {
                        $checks.first().prop("required", true).attr("aria-required", "true");
                    }
                    return;
                }

                let $controls = $fc.find("select, textarea, input[type=\"text\"], input[type=\"number\"], input[type=\"date\"], input[type=\"time\"], input[type=\"email\"], input[type=\"url\"]");
                if ($disp.length) {
                    $controls = $controls.add($disp);
                }

                if (vb_req) {
                    $controls.attr({ "aria-required": "true", "required": "required" });
                } else {
                    $controls.removeAttr("aria-required required");
                }
            },

            _setHidden: function(itemNames, hidden = true, clearOnHide = false) {
                const va_items = _asArray(itemNames);
                va_items.forEach(vs_id => {
                    const $fc = $("#" + vs_id).closest(".t-Form-fieldContainer, .a-Form-fieldContainer");
                    if (!$fc.length) return;
                    if (hidden) {
                        $fc.addClass("apex-item-hiding");
                        setTimeout(() => {
                            $fc.attr("aria-hidden", "true").hide();
                            $fc.removeClass("apex-item-hiding");
                            if (clearOnHide) {
                                try {
                                    apex.item(vs_id).setValue("");
                                } catch(e) {
                                    $("#" + vs_id).val("");
                                }
                            }
                        }, 180);
                    } else {
                        $fc.addClass("apex-item-showing").removeAttr("aria-hidden").show();
                        setTimeout(() => $fc.removeClass("apex-item-showing"), 180);
                    }
                });
            },

            _setRegionHidden: function(ids, hidden, opts = {}) {
                const vo_options = { collapseColumn: true, clearOnHide: false, clearFn: null, ...opts };
                const va_regions = _asArray(ids);
                va_regions.forEach(vs_id => {
                    const $wr = $region(vs_id);
                    if (!$wr.length) return;
                    const $col = vo_options.collapseColumn ? $wr.closest(COL_WRAP) : $();
                    if (hidden) {
                        $wr.addClass("apex-region-hiding");
                        setTimeout(() => {
                            $wr.addClass("apex-region-hidden").attr("aria-hidden", "true").removeClass("apex-region-hiding");
                            if ($col.length) {
                                if ($col.data("apx-prev-display") === undefined) {
                                    $col.data("apx-prev-display", $col[0].style.display || "");
                                }
                                $col.addClass("apex-grid-col-hidden");
                            }
                            if (vo_options.clearOnHide && typeof vo_options.clearFn === "function") {
                                vo_options.clearFn($wr.attr("id"));
                            }
                        }, 180);
                    } else {
                        $wr.addClass("apex-region-showing").removeClass("apex-region-hidden").removeAttr("aria-hidden");
                        if ($col.length) {
                            $col.removeClass("apex-grid-col-hidden");
                            const prevDisplay = $col.data("apx-prev-display");
                            if (prevDisplay !== undefined) {
                                $col[0].style.display = prevDisplay;
                                $col.removeData("apx-prev-display");
                            }
                        }
                        setTimeout(() => $wr.removeClass("apex-region-showing"), 180);
                    }
                });
            },

            _setRegionLocked: function(ids, locked, opts = {}) {
                const vo_options = { centerIcon: false, ...opts };
                const va_regions = _asArray(ids);
                va_regions.forEach(vs_id => {
                    const $wr = $region(vs_id);
                    if (!$wr.length) return;
                    let $mask = $wr.children(".apex-region-mask");
                    let $icon = $wr.children(".apex-region-lock-icon");

                    if (locked) {
                        $wr.addClass("apex-region-locked").attr("aria-disabled", "true");
                        if (!$mask.length) {
                            $mask = $("<div class=\"apex-region-mask\"></div>").appendTo($wr);
                        }
                        if (!$icon.length) {
                            $icon = $("<div class=\"apex-region-lock-icon\"></div>").appendTo($wr);
                        }
                        $icon.toggleClass("center", !!vo_options.centerIcon);
                    } else {
                        $wr.removeClass("apex-region-locked").removeAttr("aria-disabled");
                    }
                });
            },

            _handleItemCollapseExpand: function(sourceId, targetId, config) {
                const $sourceCol = $("#" + sourceId).closest(COL_WRAP);
                const $targetCol = $("#" + targetId).closest(COL_WRAP);
                this._handleCollapseExpand(sourceId, targetId, config, $sourceCol, $targetCol);
            },

            _handleRegionCollapseExpand: function(sourceId, targetId, config) {
                const $sourceCol = $region(sourceId).closest(COL_WRAP);
                const $targetCol = $region(targetId).closest(COL_WRAP);
                this._handleCollapseExpand(sourceId, targetId, config, $sourceCol, $targetCol);
            },

            _handleCollapseExpand: function(sourceId, targetId, config, $sourceCol, $targetCol) {
                if (!$sourceCol.length || !$targetCol.length) return;

                if (!$sourceCol.data("apx-original-classes")) {
                    $sourceCol.data("apx-original-classes", $sourceCol.attr("class"));
                }
                if (!$targetCol.data("apx-original-classes")) {
                    $targetCol.data("apx-original-classes", $targetCol.attr("class"));
                }

                const toColClass = (size) => typeof size === 'number' ? `col-${size}` : size;

                if (config.collapseExpand === "collapse") {
                    _animateColumnResize($sourceCol, "hide", config);
                    _animateColumnResize($targetCol, toColClass(config.expandSize), config);
                } else if (config.collapseExpand === "expand") {
                    _animateColumnResize($sourceCol, toColClass(config.collapseSize), config);
                    _animateColumnResize($targetCol, toColClass(config.expandSize), config);
                }
            }
        }
    };

    // === EXPOSE TO GLOBAL SCOPE ===
    window.setState = setState;

    // === LEGACY COMPATIBILITY (Optional - can be removed if not needed) ===
    window.setItemState = setState.item;
    window.setRegionState = setState.region;
    window.hideItem = setState.hide.item;
    window.showItem = setState.show.item;
    window.lockItem = setState.lock.item;
    window.unlockItem = setState.unlock.item;
    window.requireItem = setState.require.item;
    window.unrequireItem = setState.unrequire.item;
    window.hideRegion = setState.hide.region;
    window.showRegion = setState.show.region;
    window.lockRegion = setState.lock.region;
    window.unlockRegion = setState.unlock.region;
    window.getItemState = setState.get.item;
    window.getRegionState = setState.get.region;
    window.toggleItemState = setState.toggle.item;
    window.toggleRegionState = setState.toggle.region;
    window.restoreOriginalState = function(items, type = "item") {
        if (type === "item") {
            setState.restore.item(items);
        } else {
            setState.restore.region(items);
        }
    };
    window.batchStateChange = function(operations, type = "item") {
        if (type === "item") {
            setState.batch.items(operations);
        } else {
            setState.batch.regions(operations);
        }
    };
    window.createStateSnapshot = setState.snapshot.create;
    window.restoreFromSnapshot = setState.snapshot.restore;
    window.collapseAndExpand = setState.layout.collapseExpand; // Legacy support
    window.restoreLayout = setState.restore.layout;

})(window, jQuery);

