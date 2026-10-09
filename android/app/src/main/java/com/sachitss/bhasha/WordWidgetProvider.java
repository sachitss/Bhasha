package com.sachitss.bhasha;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Passive exposure: shows one word of the learner's deck (target word, romanisation, meaning).
 * The word changes with every system update (every 30 minutes) and on the "next" button; tapping the word opens the app.
 */
public class WordWidgetProvider extends AppWidgetProvider {
    static final String PREFS = "bhasha_widget";
    static final String KEY_ITEMS = "items";
    static final String KEY_LABEL = "label";
    static final String KEY_INDEX = "index";
    static final String ACTION_NEXT = "com.sachitss.bhasha.WIDGET_NEXT";

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        step(ctx, 1);
        for (int id : ids) mgr.updateAppWidget(id, views(ctx));
    }

    @Override
    public void onReceive(Context ctx, Intent intent) {
        super.onReceive(ctx, intent);
        if (ACTION_NEXT.equals(intent.getAction())) {
            step(ctx, 1);
            refreshAll(ctx);
        }
    }

    static void refreshAll(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, WordWidgetProvider.class));
        for (int id : ids) mgr.updateAppWidget(id, views(ctx));
    }

    private static void step(Context ctx, int by) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        p.edit().putInt(KEY_INDEX, p.getInt(KEY_INDEX, 0) + by).apply();
    }

    private static RemoteViews views(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.word_widget);
        String word = ctx.getString(R.string.widget_empty), rom = "", mean = "";
        String label = p.getString(KEY_LABEL, "");
        try {
            JSONArray items = new JSONArray(p.getString(KEY_ITEMS, "[]"));
            if (items.length() > 0) {
                int i = Math.floorMod(p.getInt(KEY_INDEX, 0), items.length());
                JSONObject it = items.getJSONObject(i);
                word = it.optString("w", "");
                rom = it.optString("r", "");
                mean = it.optString("t", "");
            }
        } catch (Exception ignored) { }
        v.setTextViewText(R.id.widget_label, label.isEmpty() ? "Bhasha" : "Bhasha · " + label);
        v.setTextViewText(R.id.widget_word, word);
        v.setTextViewText(R.id.widget_rom, rom);
        v.setViewVisibility(R.id.widget_rom, rom.isEmpty() ? View.GONE : View.VISIBLE);
        v.setTextViewText(R.id.widget_meaning, mean);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        Intent open = new Intent(ctx, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        v.setOnClickPendingIntent(R.id.widget_root, PendingIntent.getActivity(ctx, 0, open, flags));
        Intent next = new Intent(ctx, WordWidgetProvider.class).setAction(ACTION_NEXT);
        v.setOnClickPendingIntent(R.id.widget_next, PendingIntent.getBroadcast(ctx, 1, next, flags));
        return v;
    }
}
