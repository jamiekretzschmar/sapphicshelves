package com.sapphicshelves.app

import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Since this looks like a web-based app, a WebView would likely go here.
        // For now, we'll just set a basic view or layout.
        setContentView(R.layout.activity_main)
    }
}
