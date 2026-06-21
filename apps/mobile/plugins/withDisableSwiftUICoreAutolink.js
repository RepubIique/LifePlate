const { withPodfile } = require("@expo/config-plugins");

const PATCH_START = "## >>> disable-swiftuicore-autolink";
const PATCH_END = "## <<< disable-swiftuicore-autolink";

/**
 * iOS 26 / Xcode 26 split SwiftUI into SwiftUI + private SwiftUICore.
 * Expo UI / widget targets autolink SwiftUICore directly, which fails with:
 * "cannot link directly with 'SwiftUICore' because product being built is not an allowed client of it"
 *
 * Disabling SwiftUICore autolink lets symbols resolve via SwiftUI's re-export instead.
 * Based on the fix used by Expo SDK 56 apps targeting iOS 26.
 */
function buildPatch() {
  return [
    PATCH_START,
    " # iOS 26 / Xcode 26: disable direct SwiftUICore autolink on pod targets.",
    " installer.pods_project.targets.each do |t|",
    "   t.build_configurations.each do |cfg|",
    "     cfg.build_settings['OTHER_SWIFT_FLAGS'] ||= '$(inherited)'",
    "     flags = cfg.build_settings['OTHER_SWIFT_FLAGS']",
    "     flags = flags.join(' ') if flags.is_a?(Array)",
    "     unless flags.include?('-disable-autolink-framework -Xfrontend SwiftUICore')",
    "       cfg.build_settings['OTHER_SWIFT_FLAGS'] = flags + ' -Xfrontend -disable-autolink-framework -Xfrontend SwiftUICore'",
    "     end",
    "   end",
    " end",
    "",
    " # Also patch the app + widget extension targets (ExpoModulesProvider.swift, etc.).",
    " installer.aggregate_targets.each do |agg|",
    "   next unless agg.user_project",
    "   agg.user_project.native_targets.each do |target|",
    "     target.build_configurations.each do |cfg|",
    "       existing = cfg.build_settings['OTHER_SWIFT_FLAGS'] || '$(inherited)'",
    "       existing = existing.join(' ') if existing.is_a?(Array)",
    "       unless existing.include?('-disable-autolink-framework -Xfrontend SwiftUICore')",
    "         cfg.build_settings['OTHER_SWIFT_FLAGS'] = existing + ' -Xfrontend -disable-autolink-framework -Xfrontend SwiftUICore'",
    "       end",
    "     end",
    "   end",
    "   agg.user_project.save",
    " end",
    PATCH_END,
  ].join("\n");
}

function withDisableSwiftUICoreAutolink(config) {
  return withPodfile(config, (config) => {
    let podfile = config.modResults.contents;
    const patch = buildPatch();

    if (!/^\s*post_install\s+do\s+\|installer\|/m.test(podfile)) {
      podfile += `

post_install do |installer|
end
`;
    }

    if (podfile.includes(PATCH_START)) {
      podfile = podfile.replace(
        new RegExp(`${PATCH_START}[\\s\\S]*?${PATCH_END}`),
        patch,
      );
    } else {
      podfile = podfile.replace(
        /^\s*post_install\s+do\s+\|installer\|.*$/m,
        (match) => `${match}\n\n${patch}`,
      );
    }

    config.modResults.contents = podfile;
    return config;
  });
}

module.exports = withDisableSwiftUICoreAutolink;
