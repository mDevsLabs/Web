import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import raccourcis from "./shortcuts.json" with { type: "json" };

const androidMain = join("android", "app", "src", "main");
const iosApp = join("ios", "App", "App");

function ecrire(fichier, contenu) {
  mkdirSync(join(fichier, ".."), { recursive: true });
  writeFileSync(fichier, contenu);
}

if (existsSync(androidMain)) {
  const java = join(androidMain, "java", "app", "mai", "officiel", "mobile");
  mkdirSync(java, { recursive: true });
  const routes = raccourcis
    .map(({ id, title, path }) => `      {"${id}", "${title}", "${path}"}`)
    .join(",\n");

  ecrire(
    join(java, "MainActivity.java"),
    `package app.mai.officiel.mobile;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.content.pm.ShortcutInfo;
import android.content.pm.ShortcutManager;
import android.graphics.drawable.Icon;
import java.util.ArrayList;
import java.util.List;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override public void onCreate(Bundle state) {
    registerPlugin(QuizzlyWidgetPlugin.class);
    super.onCreate(state);
    publierRaccourcis();
    ouvrirRoute(getIntent());
  }
  @Override public void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
    ouvrirRoute(intent);
  }
  private void ouvrirRoute(Intent intent) {
    Uri uri = intent == null ? null : intent.getData();
    if (uri == null || !"mai".equals(uri.getScheme())) return;
    String route = uri.getPath();
    if (route == null || route.isEmpty()) route = "/";
    final String url = "https://mai-officiel.vercel.app" + route;
    getBridge().getWebView().post(() -> getBridge().getWebView().loadUrl(url));
  }
  private void publierRaccourcis() {
    if (android.os.Build.VERSION.SDK_INT < 25) return;
    ShortcutManager manager = getSystemService(ShortcutManager.class);
    if (manager == null) return;
    List<ShortcutInfo> items = new ArrayList<>();
    String[][] routes = new String[][] {
${routes}
    };
    for (String[] route : routes) {
      Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("mai://" + route[2]), this, MainActivity.class);
      intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
      items.add(new ShortcutInfo.Builder(this, route[0]).setShortLabel(route[1]).setLongLabel(route[1]).setIcon(Icon.createWithResource(this, R.mipmap.ic_launcher)).setIntent(intent).build());
    }
    manager.setDynamicShortcuts(items.subList(0, Math.min(items.size(), manager.getMaxShortcutCountPerActivity())));
  }
}
`
  );

  ecrire(
    join(java, "QuizzlyWidgetPlugin.java"),
    `package app.mai.officiel.mobile;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "QuizzlyWidget")
public class QuizzlyWidgetPlugin extends Plugin {
  @PluginMethod public void updateScore(PluginCall call) {
    Context context = getContext();
    context.getSharedPreferences("mai_quizzly", Context.MODE_PRIVATE).edit().putString("score", call.getData().toString()).apply();
    AppWidgetManager manager = AppWidgetManager.getInstance(context);
    int[] ids = manager.getAppWidgetIds(new ComponentName(context, QuizzlyWidgetProvider.class));
    new QuizzlyWidgetProvider().onUpdate(context, manager, ids);
    call.resolve();
  }
}
`
  );

  ecrire(
    join(java, "QuizzlyWidgetProvider.java"),
    `package app.mai.officiel.mobile;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;
import org.json.JSONObject;

public class QuizzlyWidgetProvider extends AppWidgetProvider {
  @Override public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
    JSONObject score;
    try { score = new JSONObject(context.getSharedPreferences("mai_quizzly", Context.MODE_PRIVATE).getString("score", "{}")); } catch (Exception ignored) { score = new JSONObject(); }
    for (int id : ids) {
      RemoteViews view = new RemoteViews(context.getPackageName(), R.layout.mai_widget);
      view.setTextViewText(R.id.widget_level, "Niveau " + score.optInt("niveau", 1));
      view.setTextViewText(R.id.widget_xp, score.optInt("xp", 0) + " XP · " + score.optInt("weeklyXp", 0) + " cette semaine");
      view.setTextViewText(R.id.widget_streak, "Série " + score.optInt("streakCount", 0) + " jours");
      setRoute(context, view, R.id.widget_root, "/quizzly");
      setRoute(context, view, R.id.widget_wakies, "/wakies");
      setRoute(context, view, R.id.widget_vibe, "/vibe");
      setRoute(context, view, R.id.widget_quizzly, "/quizzly");
      manager.updateAppWidget(id, view);
    }
  }
  private void setRoute(Context context, RemoteViews view, int viewId, String route) {
    Intent intent = new Intent(context, MainActivity.class).setAction(Intent.ACTION_VIEW).setData(Uri.parse("mai://" + route)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
    PendingIntent pending = PendingIntent.getActivity(context, route.hashCode(), intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    view.setOnClickPendingIntent(viewId, pending);
  }
}
`
  );

  ecrire(
    join(androidMain, "res", "layout", "mai_widget.xml"),
    `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android" android:id="@+id/widget_root" android:layout_width="match_parent" android:layout_height="match_parent" android:orientation="vertical" android:padding="14dp" android:background="#171717">
  <TextView android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="mAI · QUZZLY" android:textColor="#bdbdbd" android:textSize="11sp" android:textStyle="bold" />
  <TextView android:id="@+id/widget_level" android:layout_width="wrap_content" android:layout_height="wrap_content" android:layout_marginTop="5dp" android:text="Niveau 1" android:textColor="#ffffff" android:textSize="18sp" android:textStyle="bold" />
  <TextView android:id="@+id/widget_xp" android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="0 XP · 0 cette semaine" android:textColor="#dddddd" android:textSize="13sp" />
  <TextView android:id="@+id/widget_streak" android:layout_width="wrap_content" android:layout_height="wrap_content" android:layout_marginBottom="8dp" android:text="Série 0 jours" android:textColor="#dddddd" android:textSize="13sp" />
  <LinearLayout android:layout_width="match_parent" android:layout_height="wrap_content" android:orientation="horizontal">
    <TextView android:id="@+id/widget_wakies" android:layout_width="0dp" android:layout_height="44dp" android:layout_weight="1" android:gravity="center" android:text="Wakies" android:textColor="#ffffff" android:background="#303030" />
    <TextView android:id="@+id/widget_vibe" android:layout_width="0dp" android:layout_height="44dp" android:layout_marginStart="6dp" android:layout_weight="1" android:gravity="center" android:text="Vibe" android:textColor="#ffffff" android:background="#303030" />
    <TextView android:id="@+id/widget_quizzly" android:layout_width="0dp" android:layout_height="44dp" android:layout_marginStart="6dp" android:layout_weight="1" android:gravity="center" android:text="Quizzly" android:textColor="#ffffff" android:background="#303030" />
  </LinearLayout>
</LinearLayout>
`
  );
  ecrire(
    join(androidMain, "res", "xml", "mai_widget_info.xml"),
    `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android" android:minWidth="250dp" android:minHeight="150dp" android:initialLayout="@layout/mai_widget" android:resizeMode="horizontal|vertical" android:updatePeriodMillis="0" android:widgetCategory="home_screen" />
`
  );

  const manifestPath = join(androidMain, "AndroidManifest.xml");
  let manifest = readFileSync(manifestPath, "utf8");
  if (!manifest.includes("QuizzlyWidgetProvider")) {
    manifest = manifest.replace(
      "        <activity",
      `        <receiver android:name=".QuizzlyWidgetProvider" android:exported="false">
            <intent-filter><action android:name="android.appwidget.action.APPWIDGET_UPDATE" /></intent-filter>
            <meta-data android:name="android.appwidget.provider" android:resource="@xml/mai_widget_info" />
        </receiver>
        <activity`
    );
  }
  if (!manifest.includes('android:scheme="mai"')) {
    manifest = manifest.replace(
      "            </intent-filter>\n\n        </activity>",
      `            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="mai" />
            </intent-filter>

        </activity>`
    );
  }
  writeFileSync(manifestPath, manifest);
}

if (existsSync(iosApp)) {
  const shortcutsPath = join(iosApp, "AppShortcuts.swift");
  const alreadyCustomized =
    existsSync(shortcutsPath) &&
    readFileSync(shortcutsPath, "utf8").includes("// @manual-shortcuts");

  if (!alreadyCustomized) {
    const shortcuts = raccourcis
      .map(
        ({ title, path, phrase }) =>
          `        AppShortcut(intent: OuvrirRaccourciMAI(chemin: "${path}"), phrases: ["${phrase} dans \\(.applicationName)"], shortTitle: "${title}", systemImageName: "sparkles")`
      )
      .join(",\n");
    ecrire(
      shortcutsPath,
      `#if canImport(AppIntents)
import AppIntents
import Foundation

@available(iOS 18.0, *)
struct OuvrirRaccourciMAI: AppIntent {
    static var title: LocalizedStringResource = "Ouvrir mAI"
    static var openAppWhenRun = true
    @Parameter(title: "Chemin") var chemin: String
    init() { chemin = "/" }
    init(chemin: String) { self.chemin = chemin }
    func perform() async throws -> some IntentResult & OpensIntent {
        let cheminValide = chemin.hasPrefix("/") ? chemin : "/" + chemin
        guard let url = URL(string: "mai://" + cheminValide) else {
            throw NSError(
                domain: "OuvrirRaccourciMAI",
                code: 1,
                userInfo: [NSLocalizedDescriptionKey: "URL invalide: mai://\\(cheminValide)"]
            )
        }
        return .result(opensIntent: OpenURLIntent(url))
    }
}

@available(iOS 18.0, *)
struct RaccourcisMAI: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] = [
${shortcuts}
    ]
    static var shortcutTileColor: ShortcutTileColor = .blue
}
#endif
`
    );
  }

  const delegatePath = join(iosApp, "AppDelegate.swift");
  if (existsSync(delegatePath)) {
    let delegate = readFileSync(delegatePath, "utf8");
    if (!delegate.includes("mai-officiel.vercel.app")) {
      const needle = "        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)";
      const addition = `        if url.scheme == "mai", let controller = window?.rootViewController as? CAPBridgeViewController, let route = URL(string: "https://mai-officiel.vercel.app" + url.path) {
            DispatchQueue.main.async { controller.bridgedWebView?.load(URLRequest(url: route)) }
        }
${needle}`;
      if (delegate.includes(needle)) {
        delegate = delegate.replace(needle, addition);
      } else {
        delegate = delegate.replace(
          "import Capacitor",
          `import Capacitor
import WebKit`
        );
        const method = `
    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        if url.scheme == "mai", let controller = window?.rootViewController as? CAPBridgeViewController, let route = URL(string: "https://mai-officiel.vercel.app" + url.path) {
            controller.bridgedWebView?.load(URLRequest(url: route))
            return true
        }
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }
`;
        delegate = delegate.replace("\n}", `${method}\n}`);
      }
      writeFileSync(delegatePath, delegate);
    }
  }

  const plistPath = join(iosApp, "Info.plist");
  let plist = readFileSync(plistPath, "utf8");
  if (!plist.includes("mai-raccourcis")) {
    plist = plist.replace(
      "</dict>",
      `\t<key>CFBundleURLTypes</key>
\t<array>
\t\t<dict>
\t\t\t<key>CFBundleURLName</key><string>mai-raccourcis</string>
\t\t\t<key>CFBundleURLSchemes</key><array><string>mai</string></array>
\t\t</dict>
\t</array>
</dict>`
    );
    writeFileSync(plistPath, plist);
  }

  const projectPath = join("ios", "App", "App.xcodeproj", "project.pbxproj");
  if (existsSync(projectPath)) {
    let project = readFileSync(projectPath, "utf8");
    if (!project.includes("AppShortcuts.swift")) {
      const fileRef = "A11A00000000000000000002";
      const buildRef = "A11A00000000000000000001";
      project = project
        .replace(
          "/* Begin PBXBuildFile section */",
          `/* Begin PBXBuildFile section */\n\t\t${buildRef} /* AppShortcuts.swift in Sources */ = {isa = PBXBuildFile; fileRef = ${fileRef} /* AppShortcuts.swift */; };`
        )
        .replace(
          "/* Begin PBXFileReference section */",
          `/* Begin PBXFileReference section */\n\t\t${fileRef} /* AppShortcuts.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = AppShortcuts.swift; sourceTree = "<group>"; };`
        )
        .replace(
          "504EC3071FED79650016851F /* AppDelegate.swift */,",
          `504EC3071FED79650016851F /* AppDelegate.swift */,\n\t\t\t\t${fileRef} /* AppShortcuts.swift */,`
        )
        .replace(
          "504EC3081FED79650016851F /* AppDelegate.swift in Sources */,",
          `504EC3081FED79650016851F /* AppDelegate.swift in Sources */,\n\t\t\t\t${buildRef} /* AppShortcuts.swift in Sources */,`
        );
      writeFileSync(projectPath, project);
    }
  }
}

console.log("Configuration native des 20 raccourcis et du widget Quizzly terminée.");
