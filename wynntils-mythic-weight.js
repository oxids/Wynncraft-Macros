/*
* Usage: This script is adding a listener to the Tooltip Render event, which allows item weights loaded via API calls to be displayed on top of items.
* The settings in the region below can be changed freely to easily customize the experience using this script.
*
* If you have any issues or ideas, feel free to contact oxids on Discord!
*
* Also, do with this code as you like. If you make any improvements, feel free to let me know, so I can also add them to the public script :)
* */



//region Settings

// Description: Toggles weights from Nori.fish being displayed.
// Possible values: true & false
const ADD_NORI_WEIGHTS = true;

// Description: Indicator that's displayed in front of Nori weights.
// This indicator is only displayed if weights from multiple origins are loaded or ALWAYS_SHOW_NORI_INDICATOR is set to true.
// Possible values: Any text A-Z, no spaces
const NORI_INDICATOR = 'NF';

// Description: Indicator that's displayed in front of Nori weights, if there are multiple weights. Leave empty to always show the normal indicator.
// The first weight will show the value from NORI_INDICATOR, all other weights will show this value.
// This indicator is only displayed if weights from multiple origins are loaded or ALWAYS_SHOW_NORI_INDICATOR is set to true.
// Possible values: Any text
const NORI_SUB_INDICATOR = '  • ';

// Description: Color for the NORI_INDICATOR and NORI_SUB_INDICATOR indicator.
// Possible values: Any hex color, e.g. '#FF0000' for red
const NORI_COLOR = '#1cb7ff';

// Description: Toggles whether the NORI_INDICATOR and NORI_SUB_INDICATOR indicators are always displayed, even if there are no other weight origins.
// Possible values: true & false
const ALWAYS_SHOW_NORI_INDICATOR = false;



// Description: Toggles weights from Wynnpool being displayed.
// Possible values: true & false
const ADD_WYNNPOOL_WEIGHTS = true;

// Description: Indicator that's displayed in front of Wynnpool weights.
// This indicator is only displayed if weights from multiple origins are loaded or ALWAYS_SHOW_WYNNPOOL_INDICATOR is set to true.
// Possible values: Any text A-Z, no spaces
const WYNNPOOL_INDICATOR = 'WP';

// Description: Indicator that's displayed in front of Nori weights, if there are multiple weights. Leave empty to always show the normal indicator.
// The first weight will show the value from WYNNPOOL_INDICATOR, all other weights will show this value.
// This indicator is only displayed if weights from multiple origins are loaded or ALWAYS_SHOW_WYNNPOOL_INDICATOR is set to true.
// Possible values: Any text
const WYNNPOOL_SUB_INDICATOR = '  • ';

// Description: Color for the WYNNPOOL_INDICATOR and WYNNPOOL_SUB_INDICATOR indicator.
// Possible values: Any hex color, e.g. '#FF0000' for red
const WYNNPOOL_COLOR = '#ff9900';

// Description: Toggles whether the WYNNPOOL_INDICATOR and WYNNPOOL_SUB_INDICATOR indicators are always displayed, even if there are no other weight origins.
// Possible values: true & false
const ALWAYS_SHOW_WYNNPOOL_INDICATOR = false;



// Description: How many decimals are displayed on the weighting scales.
// Example: 1 will cause weights to be displayed as [29.5%] or 2 will cause weights to be displayed as [29.48%].
// Possible values: Any number, e.g. 1, 2, 3
const IDENTIFICATION_DECIMALS = 1;

// Description: Text that is displayed in front of scale names.
// Example: "Scale:" will cause a scale named "Main" to be displayed as "Scale: Main".
// Possible values: Any text
const SCALE_PRETEXT = '';

// Description: Text that is displayed after scale names.
// Example: "Scale" will cause a scale named "Main" to be displayed as "Main Scale".
// Possible values: Any text
const SCALE_AFTERTEXT = 'Scale';

// Description: Toggles an empty line between scale origins.
// Possible values: true & false
const SHOW_SCALE_SEPERATOR_LINE = false;

// Description: Text that is displayed in front of detail lines when holding l-shift.
// Example: ">" will cause an identification named "Fire Damage" to be displayed as "> Fire Damage (47.5%)".
// Possible values: Any text
const DETAIL_PRETEXT = '◦';

//endregion Settings



// ============================
// DO NOT EDIT ANYTHING BELOW
// ============================



//region Wynntils Imports

const WYNNTILS_Models = Java.type('com.wynntils.core.components.Models');
const WYNNTILS_IdentifiableItemProperty = Java.type('com.wynntils.models.items.properties.IdentifiableItemProperty');
const WYNNTILS_StatCalculator = Java.type('com.wynntils.models.stats.StatCalculator');
const WYNNTILS_WynntilsMod = Java.type('com.wynntils.core.WynntilsMod');
const WYNNTILS_ItemTooltipRenderEvent = Java.type('com.wynntils.mc.event.ItemTooltipRenderEvent');
const WYNNTILS_Managers = Java.type('com.wynntils.core.components.Managers');
const WYNNTILS_ItemStatInfoFeature = Java.type('com.wynntils.features.tooltips.ItemStatInfoFeature');
const WYNNTILS_ColorScaleUtils = Java.type('com.wynntils.utils.wynn.ColorScaleUtils');
const WYNNTILS_KeyboardUtils = Java.type('com.wynntils.utils.mc.KeyboardUtils');

//endregion



//region Minecraft & Java Imports

const JAVA_ArrayList = Java.type('java.util.ArrayList');
const JAVA_Float = Java.type('java.lang.Float');
const MINECRAFT_Text = Java.type('net.minecraft.class_2561');
const LWJAVA_GLFW = Java.type('org.lwjgl.glfw.GLFW');
const MINECRAFT_Style = Java.type('net.minecraft.class_2583');
const MINECRAFT_Identifier = Java.type('net.minecraft.class_2960');

//endregion



//region Kill Event Listener

const EVENT_LISTENERS = [];
const KNOWN_WEIGHTS = new Map();

addKilLEvent();
async function addKilLEvent() {
    const killEvent = JsMacros.createCustomEvent("KillScripts_wynntils-mythic-weight_E794735C-0573-4843-96FE-CBABBDAB42C8");
    killEvent.registerEvent();

    // Kills existing instances of the script and waits shortly, in case the script was started multiple times at the exact same time
    killEvent.trigger();
    Time.sleep(500);

    EVENT_LISTENERS.push(JsMacros.on("KillScripts_wynntils-mythic-weight_E794735C-0573-4843-96FE-CBABBDAB42C8",
        JavaWrapper.methodToJava((event) => {
            try {
                EVENT_LISTENERS.forEach(eventListener => eventListener.off());
                KNOWN_WEIGHTS.clear();
                GlobalVars.remove("onTooltipRendered_E794735C-0573-4843-96FE-CBABBDAB42C8");
            } catch (error) {
                showError(error);
            }
        })
    ));
}


//endregion



//region Tooltip Event Listener

if (!GlobalVars.getString("addListenerIdentifier_E794735C-0573-4843-96FE-CBABBDAB42C8")) {
    addListener();

    async function addListener() {

        // It is possible that the macro is triggered so fast, multiple instances land in here
        // For that reason, a unique identifier is put into global storage to make sure only one instance is running
        const identifier = (new Date()).toISOString() + '-' + Math.floor(Math.random() * 999999);
        GlobalVars.putString("addListenerIdentifier_E794735C-0573-4843-96FE-CBABBDAB42C8", identifier);
        Time.sleep(500);

        if (GlobalVars.getString("addListenerIdentifier_E794735C-0573-4843-96FE-CBABBDAB42C8") !== identifier) {
            return;
        }

        GlobalVars.putObject("showError_E794735C-0573-4843-96FE-CBABBDAB42C8", showError);

        const eventBus = Reflection.getDeclaredField(WYNNTILS_WynntilsMod, 'eventBus');
        eventBus.setAccessible(true);

        eventBus.get(null).addListener(WYNNTILS_ItemTooltipRenderEvent.Pre.class, JavaWrapper.methodToJava(event => {
            try {
                const onTooltipRendered = GlobalVars.getObject("onTooltipRendered_E794735C-0573-4843-96FE-CBABBDAB42C8");
                if (!onTooltipRendered) {
                    return;
                }

                onTooltipRendered(event);
            } catch (error) {
                GlobalVars.getObject("showError_E794735C-0573-4843-96FE-CBABBDAB42C8")(error);
            }
        }));
    }
}

//endregion



//region Tooltip Rendered Event

GlobalVars.putObject("onTooltipRendered_E794735C-0573-4843-96FE-CBABBDAB42C8", onTooltipRendered);
function onTooltipRendered(event) {
    try {
        if (!weightsLoaded) {
            return;
        }

        const itemStack = event.getItemStack();
        const showDetails = WYNNTILS_KeyboardUtils.isKeyDown(LWJAVA_GLFW.GLFW_KEY_LEFT_SHIFT);

        let cachedWeight = KNOWN_WEIGHTS.get(itemStack) ?? [];
        let itemWeight = cachedWeight.find(i => i.showDetails === showDetails)?.itemWeight;

        if (itemWeight) {
            itemWeight = [...itemWeight]; // Break reference to not accidentally override anything in the cache
        } else {
            const wynnItem = WYNNTILS_Models.Item.asWynnItemProperty(itemStack, WYNNTILS_IdentifiableItemProperty.class);
            if (!wynnItem || wynnItem.isEmpty()) {
                return;
            }

            itemWeight = getTotalItemWeight(wynnItem.get(), showDetails).flat(Infinity).filter(text => !!text);
            if (!itemWeight?.length) {
                return;
            }

            cachedWeight.unshift({
                itemWeight:  [...itemWeight], // Break reference to not accidentally override anything in the cache
                date: new Date(),
                showDetails: showDetails
            });
            KNOWN_WEIGHTS.set(itemStack, cachedWeight);

            // Remove old Cache to prevent too much memory usage
            for (const weightKey of KNOWN_WEIGHTS.keys()) {
                if (!KNOWN_WEIGHTS.get(weightKey).find(w => (new Date() - w.date) < 1000 * 60 * 15)) {
                    KNOWN_WEIGHTS.delete(weightKey);
                }
            }
        }

        // Add spacing so items with an Attack Speed look better
        const tooltips = new JAVA_ArrayList(event.getTooltips());
        if (!tooltips[1].method_27662()?.toString()?.includes('literal{ }')) { // copyContentOnly
            tooltips.addAll(1, [MINECRAFT_Text.method_30163('')]); // of
        }

        tooltips.addAll(1, itemWeight);
        event.setTooltips(tooltips);
    } catch (error) {
        showError(error);
    }
}

//endregion



//region Load Mythic weights

let weights = {};
let weightsLoaded = false;

addWeights();
async function addWeights() {
    if (ADD_NORI_WEIGHTS) {
        try {
            const weightsRaw = Request.get('https://nori.fish/api/item/mythic')?.text();
            const weightsParsed = JSON.parse(weightsRaw)?.weights;

            if (!weightsParsed || !Object.keys(weightsParsed).length) {
                throw new Error('No mythic weights found');
            }

            for (const mythicKey of Object.keys(weightsParsed)) {
                if (!weights[mythicKey]) {
                    weights[mythicKey] = {};
                }

                for (const scaleKey of Object.keys(weightsParsed[mythicKey])) {
                    weights[mythicKey][scaleKey
                    + ';Nori' // In case Nori and Wynnpool have a scale with the same name
                        ] = weightsParsed[mythicKey][scaleKey];
                }
            }
        } catch (error) {
            showError('Could not fetch nori item weights: ' + error);
        }
    }

    if (ADD_WYNNPOOL_WEIGHTS) {
        try {
            const weightsRaw = Request.get('https://api.wynnpool.com/item/weight/all')?.text();
            const weightsParsed = JSON.parse(weightsRaw);

            if (!weightsParsed?.length) {
                throw new Error('No mythic weights found');
            }

            for (const scale of weightsParsed) {
                const mythicKey = scale.item_name;

                if (!weights[mythicKey]) {
                    weights[mythicKey] = {};
                }

                // Sort the identifications, as they are unsorted by default
                const identifications = [];
                for (const identificationKey of Object.keys(scale.identifications)) {
                    identifications.push({ name: identificationKey, weight: scale.identifications[identificationKey] *= 100 });
                }

                identifications.sort((a, b) => {
                    return b.weight - a.weight;
                });

                const scaleKey = scale.weight_name
                    + ';Wynnpool'; // In case Nori and Wynnpool have a scale with the same name

                weights[mythicKey][scaleKey] = {};
                for (const identification of identifications) {
                    weights[mythicKey][scaleKey][identification.name] = identification.weight;
                }
            }
        } catch (error) {
            showError('Could not fetch wynnpool item weights: ' + error);
        }
    }

    weightsLoaded = true;
}

//endregion



//region Calculate mythic weights

function getTotalItemWeight(wynnItem, showDetails) {
    const itemName = wynnItem?.getName();
    if (!itemName) {
        return [];
    }

    // Checks if the item has any loaded scales
    const itemWeight = weights[itemName];
    if (!itemWeight) {
        return [];
    }

    let lastOrigin = null;
    let renderedScalesForOrigin = 0;

    return Object.keys(itemWeight).map((weightScaleName, index) => {
        const weightScale = itemWeight[weightScaleName];
        const identifications = wynnItem.getIdentifications();
        const weight = calculateWeights(wynnItem, weightScale, identifications);

        if (!weight) {
            return null;
        }

        const itemStatInfoFeature = WYNNTILS_Managers.Feature.getFeatureInstance(WYNNTILS_ItemStatInfoFeature.class);
        const origin = weightScaleName.split(';')[1];

        const weightTextLines = getItemWeightTextLines(showDetails);

        // Showing weight details on lshift with one line per weight stat
        if (showDetails) {
            weightTextLines.push(getItemWeightDetailTextLines());
        }

        return weightTextLines;


        function calculateWeights() {
            const possibleValues = wynnItem.getPossibleValues();
            if (!identifications?.length || !possibleValues?.length) {
                return null;
            }

            let totalValue = 0;
            let totalWeighting = 0;

            const calculatedWeights = {
                percentage: 0,
                weights: {}
            };

            for (const identificationName of Object.keys(weightScale)) {
                const curValue = identifications.find(identification => identification.statType().getApiName()?.toUpperCase() === identificationName?.toUpperCase());
                const possibleValue = possibleValues.find(identification => identification.statType().getApiName()?.toUpperCase() === identificationName?.toUpperCase());

                if (!curValue || !possibleValue) {
                    continue;
                }

                let percentage = WYNNTILS_StatCalculator.getPercentage(curValue, possibleValue);
                if (!percentage && percentage !== 0) {
                    continue;
                }

                const weighting = weightScale[identificationName];

                // Negative weight means a worse roll is better
                // E.g. an item with HP between -1000 and -2000 having -10% weight, means -1900 Health would be a 90% percentage
                if (weighting < 0) {
                    percentage = 100 - percentage;
                }

                totalValue += percentage * Math.abs(weighting);
                totalWeighting += Math.abs(weighting);

                calculatedWeights.weights[identificationName] = { weighting: weighting, percentage: percentage };
            }

            if (totalValue && totalWeighting) {
                calculatedWeights.percentage = totalValue / totalWeighting;
            }

            return calculatedWeights;
        }


        function getItemWeightTextLines(showDetails) {
            const weightTextLines = [];
            const scalesShown = (ADD_WYNNPOOL_WEIGHTS ? 1 : 0) +
                (ADD_NORI_WEIGHTS ? 1 : 0);

            if (origin !== lastOrigin) {
                if (!showDetails && lastOrigin && SHOW_SCALE_SEPERATOR_LINE) {
                    weightTextLines.push(MINECRAFT_Text.method_30163('')); // of
                }

                renderedScalesForOrigin = 0;
                lastOrigin = origin;
            }

            weightTextLines.push(

                // Scale icon (e.g. Nori, Wynnpool)
                getScaleOriginIcon(origin, scalesShown)

                // Scale name (e.g. Main Scale, Spell Scale)
                .method_10852( //append
                    MINECRAFT_Text.method_30163('§7' // of
                        + (SCALE_PRETEXT ? SCALE_PRETEXT + ' ' : '')
                        + weightScaleName.split(';')[0]
                        + (SCALE_AFTERTEXT ? ' ' + SCALE_AFTERTEXT : ''))
                )

                // Scale % (e.g. 70%)
                .method_10852( // append
                    WYNNTILS_ColorScaleUtils.getPercentageTextComponent(
                        itemStatInfoFeature.getColorMap(),
                        new JAVA_Float(weight.percentage),
                        itemStatInfoFeature.colorLerp.get(),
                        IDENTIFICATION_DECIMALS
                    )
                )
            );

            renderedScalesForOrigin++;
            return weightTextLines;
        }


        function getItemWeightDetailTextLines() {
            const weightTextLines = [];

            for (const identificationName of Object.keys(weightScale)) {
                weightTextLines.push(MINECRAFT_Text.method_30163('') // of

                    // Weight name (e.g. Fire Damage %)
                    .method_10852( // append
                        MINECRAFT_Text.method_30163('§7    ' // of
                            + (DETAIL_PRETEXT ? DETAIL_PRETEXT + ' ' : '')
                            + identifications?.find(identification => identification.statType()?.getApiName() === identificationName)?.statType()?.getDisplayName()

                            // To show difference between Health Regen Raw and Health Regen %
                            + (identificationName.endsWith('Raw') || identificationName.startsWith('raw') ? ' Raw' : ''))
                    )

                    // Weight weighting (e.g. 40% of total scale)
                    .method_10852( // append
                        MINECRAFT_Text.method_30163('§7 (' // of
                            + (Math.round(weight.weights[identificationName].weighting * 10) / 10)
                            + '%)')
                    )

                    // Roll % (e.g. Stealing 5 - 10% at 10% would be 100%)
                    .method_10852( // append
                        WYNNTILS_ColorScaleUtils.getPercentageTextComponent(itemStatInfoFeature.getColorMap(),
                            new JAVA_Float(weight.weights[identificationName].percentage),
                            itemStatInfoFeature.colorLerp.get(),
                            IDENTIFICATION_DECIMALS
                        )
                    )
                );
            }

            // Adds some space between the weights for better distinction when their weight details are displayed
            if (index < Object.keys(itemWeight).length - 1) {
                weightTextLines.push(MINECRAFT_Text.method_30163('')); // of
            }

            return weightTextLines;
        }

        function getScaleOriginIcon(origin, scalesShown) {
            let color = null;
            let text = null;
            let subIndicator = null;

            switch (origin) {
                case 'Nori':
                    if (!ALWAYS_SHOW_NORI_INDICATOR && scalesShown <= 1) {
                        return MINECRAFT_Text.method_30163('') // of;
                    }

                    text = NORI_INDICATOR;
                    color = NORI_COLOR;
                    if (renderedScalesForOrigin > 0 && NORI_SUB_INDICATOR && !showDetails) {
                        subIndicator = NORI_SUB_INDICATOR;
                    }
                    break;
                case 'Wynnpool':
                    if (!ALWAYS_SHOW_WYNNPOOL_INDICATOR && scalesShown <= 1) {
                        return MINECRAFT_Text.method_30163('') // of;
                    }

                    text = WYNNPOOL_INDICATOR;
                    color = WYNNPOOL_COLOR;
                    if (renderedScalesForOrigin > 0 && WYNNPOOL_SUB_INDICATOR && !showDetails) {
                        subIndicator = WYNNPOOL_SUB_INDICATOR;
                    }
                    break;
            }

            if (subIndicator) {
                return MINECRAFT_Text.method_30163(subIndicator + ' ') // of
                    .method_27696( //fillStyle
                        MINECRAFT_Style
                            .field_24360 //EMPTY
                            .method_36139( //withColor
                                hexToRgb(color)
                            )
                    )
            }

            return MINECRAFT_Text.method_30163('') // of

                // Background
                .method_10852( //append
                    MINECRAFT_Text
                        .method_43470( //literal
                            '\uE060\uDAFF\uDFFF' + parseTextToWynntilsFontText(text.trim()) + '\uDAFF\uDFFF\uE062' + ' '
                        )
                        .method_27696( //fillStyle
                            MINECRAFT_Style
                                .field_24360 //EMPTY
                                .method_27704( //withFont
                                    MINECRAFT_Identifier.method_60655( //of
                                        'minecraft', 'banner/pill'
                                    )
                                )
                                .method_36139( //withColor
                                    hexToRgb(color)
                                )
                        )
                );

            function hexToRgb(hex) {
                return parseInt(hex.substring(1), 16);
            }

            function parseTextToWynntilsFontText(text) {
                let result = '';

                for (let i = 0; i < text.length; i++) {
                    const char = text[i].toLowerCase();

                    // Wynntils has each Letter with their unique symbol
                    // A = \uE030
                    // B = \uE031
                    // ...

                    if (!/^[a-z]$/.test(char)) {
                        continue;
                    }

                    result += String.fromCharCode('\uE030'.charCodeAt(0) + char.charCodeAt(0) - 97)
                    if (i < text.length - 1) {
                        result += '\uDAFF\uDFFF';
                    }
                }

                return result;
            }
        }
    });
}

//endregion



//region Help Functions

function showError(error) {

    // Ignore this specific error
    // If you know how to fix it instead of hiding it, let me know! :D
    if (error?.toString()?.includes('Multi threaded access requested by thread Thread[') && error.toString().includes('] but is not allowed for language(s) js.')) {
        return;
    }

    Chat.log('ERROR in wynntils-mythic-weight.js: ' + error);
}

//endregion
