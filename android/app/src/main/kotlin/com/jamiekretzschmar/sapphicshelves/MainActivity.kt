package com.jamiekretzschmar.sapphicshelves

import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Ensure R is imported from the correct package if needed
        setContentView(R.layout.activity_main)
    }
}
