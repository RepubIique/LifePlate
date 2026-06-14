const { withXcodeProject } = require('@expo/config-plugins');

/**
 * Xcode 15+ enables ENABLE_USER_SCRIPT_SANDBOXING by default, which blocks the
 * "Bundle React Native code and images" phase from replacing main.jsbundle.
 */
function withDisableUserScriptSandboxing(config) {
  return withXcodeProject(config, (config) => {
    config.modResults.addBuildProperty('ENABLE_USER_SCRIPT_SANDBOXING', 'NO');
    return config;
  });
}

module.exports = withDisableUserScriptSandboxing;
