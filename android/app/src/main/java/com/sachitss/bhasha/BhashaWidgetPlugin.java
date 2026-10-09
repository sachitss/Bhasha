package com.sachitss.bhasha;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;

/** Receives the learner's current word deck from the web app and refreshes the home-screen widget. */
@CapacitorPlugin(name = "BhashaWidget")
public class BhashaWidgetPlugin extends Plugin {
    @PluginMethod
    public void update(PluginCall call) {
        JSArray items = call.getArray("items", new JSArray());
        String label = call.getString("label", "");
        Context ctx = getContext();
        SharedPreferences prefs = ctx.getSharedPreferences(WordWidgetProvider.PREFS, Context.MODE_PRIVATE);
        prefs.edit()
            .putString(WordWidgetProvider.KEY_ITEMS, items.toString())
            .putString(WordWidgetProvider.KEY_LABEL, label)
            .putInt(WordWidgetProvider.KEY_INDEX, 0)
            .apply();
        WordWidgetProvider.refreshAll(ctx);
        call.resolve();
    }
}
