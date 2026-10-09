package com.sachitss.bhasha;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BhashaWidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
