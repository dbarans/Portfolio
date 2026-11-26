package com.roomplanner.domain.room

// On the JVM these come from java.lang.Math; Kotlin/JS has no java.lang, so this
// same-package object stands in for the three calls the domain makes.
internal object Math {
    fun toRadians(degrees: Double): Double = degrees / 180.0 * kotlin.math.PI
    fun toDegrees(radians: Double): Double = radians * 180.0 / kotlin.math.PI
    fun floorMod(x: Int, y: Int): Int = ((x % y) + y) % y
}
