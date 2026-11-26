// Compiles the Room Planner app's :domain module (plain Kotlin, no Android) to JavaScript for the
// interactive demo on room-planner.html. The domain sources are read from the app's repository and
// compiled as they are; the only additions are shims/ (Math.toDegrees/toRadians/floorMod, which come
// from java.lang on the JVM) and the small @JsExport facade in src/jsMain.
//
//   ./gradlew.bat publishDemo      (JAVA_HOME = a JDK 17, e.g. "D:\Android Studio\jbr")
//
// Set -PappRepo=<path> if the app is not at D:/Projects/Android/RoomPlaner.

plugins {
    kotlin("multiplatform") version "2.0.21"
}

val appRepo = (findProperty("appRepo") as String?) ?: "D:/Projects/Android/RoomPlaner"
val domainSources = file("$appRepo/domain/src/main/kotlin")

kotlin {
    js(IR) {
        moduleName = "room-planner-domain"
        browser()
        useEsModules()
        binaries.executable()
    }
    sourceSets {
        jsMain {
            // Rooms.kt is the room library (coroutines Mutex, UUIDs, the system clock); the demo
            // doesn't need it, so it stays out rather than being changed.
            kotlin.srcDir(domainSources)
            kotlin.exclude("com/roomplanner/domain/project/Rooms.kt")
            kotlin.srcDir("shims")
            dependencies {
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")
            }
        }
    }
}

tasks.register<Sync>("publishDemo") {
    dependsOn("compileProductionExecutableKotlinJs")
    from(layout.buildDirectory.dir("compileSync/js/main/productionExecutable/kotlin"))
    include("*.mjs")
    // Published as .js: some static servers send .mjs as text/plain, which browsers refuse to run
    // as a module. The source maps stay in build/, so the comment pointing at them goes too.
    rename { it.removeSuffix(".mjs") + ".js" }
    filter { line ->
        if (line.startsWith("//# sourceMappingURL")) "" else line.replace(Regex("""(from '[^']+)\.mjs'"""), "$1.js'")
    }
    into(rootDir.resolve("../../js/room-planner"))
}
