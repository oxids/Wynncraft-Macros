try {
    const killEvent = JsMacros.createCustomEvent("KillScripts_wynntils-mythic-weight_E794735C-0573-4843-96FE-CBABBDAB42C8");
    killEvent.registerEvent();
    killEvent.trigger();
} catch (error) {
    showError(error);
}

function showError(error) {
    Chat.log('ERROR in kill-scripts.js: ' + error);
}