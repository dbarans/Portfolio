@file:OptIn(ExperimentalJsExport::class)

package demo

import com.roomplanner.domain.furniture.Furniture
import com.roomplanner.domain.furniture.FurnitureId
import com.roomplanner.domain.geometry.ConvexPolygon
import com.roomplanner.domain.geometry.Vec2
import com.roomplanner.domain.geometry.angleOf
import com.roomplanner.domain.placement.AngleSnapper
import com.roomplanner.domain.placement.WallAligner
import com.roomplanner.domain.placement.WallSnapper
import com.roomplanner.domain.project.Project
import com.roomplanner.domain.project.SampleProject
import com.roomplanner.domain.room.Door
import com.roomplanner.domain.room.Radiator
import com.roomplanner.domain.room.Room
import com.roomplanner.domain.room.Stove
import com.roomplanner.domain.room.Window
import com.roomplanner.domain.room.body
import com.roomplanner.domain.room.face
import com.roomplanner.domain.room.frontZone
import com.roomplanner.domain.room.swingAreas
import com.roomplanner.domain.rules.BlocksRadiator
import com.roomplanner.domain.rules.CollisionRule
import com.roomplanner.domain.rules.DoorSwingRule
import com.roomplanner.domain.rules.InDoorSwing
import com.roomplanner.domain.rules.InFrontOfRadiator
import com.roomplanner.domain.rules.LayoutAnalyzer
import com.roomplanner.domain.rules.LayoutSettings
import com.roomplanner.domain.rules.OutsideRoom
import com.roomplanner.domain.rules.OutsideRoomRule
import com.roomplanner.domain.rules.OverhangsRadiator
import com.roomplanner.domain.rules.OverlapsFurniture
import com.roomplanner.domain.rules.PlacementIssue
import com.roomplanner.domain.rules.RadiatorRule
import com.roomplanner.domain.rules.StoveClearanceRule
import com.roomplanner.domain.rules.TooCloseToStove
import kotlin.math.roundToInt

/**
 * The page's only door into the app's domain code. It holds the sample project from the app and
 * does what the planner's ViewModel does on a drag or a turn of the rotation handle: the same
 * snapping, the same rules, the same thresholds. Everything it returns is JSON, so the page needs
 * no knowledge of Kotlin types.
 */
@JsExport
class PlannerDemo {
    private var project: Project = SampleProject.create()
    private val settings = LayoutSettings()

    // The same five rules the app registers with Hilt multibinding (DomainModule.kt).
    private val analyzer = LayoutAnalyzer(
        listOf(CollisionRule(), OutsideRoomRule(), StoveClearanceRule(), DoorSwingRule(), RadiatorRule()),
    )
    private val wallSnapper = WallSnapper()
    private val angleSnapper = AngleSnapper()
    private val aligner = WallAligner()

    fun reset() {
        project = SampleProject.create()
    }

    /** The topmost piece under (x, y) in cm, or null. */
    fun pieceAt(x: Double, y: Double): String? = project.furnitureAt(Vec2(x, y))?.id?.value

    /**
     * Moves piece [id] so its centre is at (x, y), as a finger drag does in the planner:
     * the centre is kept inside the room and, with [snap], the piece is pulled against walls
     * it is parallel to. [cmPerPixel] sets the pull distance, as on the phone.
     */
    fun moveTo(id: String, x: Double, y: Double, snap: Boolean, cmPerPixel: Double) {
        update(id) { item ->
            val moved = item.movedTo(clampToRoom(Vec2(x, y), project.room))
            if (!snap) {
                moved
            } else {
                val threshold = (SNAP_DISTANCE_PX * cmPerPixel).coerceIn(MIN_SNAP_CM, MAX_SNAP_CM)
                wallSnapper.snap(moved, project.room, threshold)
            }
        }
    }

    /** Turns piece [id] to face the handle dragged to (x, y), snapping to useful angles with [snap]. */
    fun rotateTowards(id: String, x: Double, y: Double, snap: Boolean) {
        update(id) { item ->
            val raw = angleOf(Vec2(x, y) - item.placement.center) - QUARTER_TURN
            val angle = if (snap) angleSnapper.snap(raw, project.room) else raw.roundToInt().toDouble()
            item.rotatedTo(angle)
        }
    }

    fun rotateBy(id: String, degrees: Double) {
        update(id) { it.rotatedTo(it.placement.rotationDegrees + degrees) }
    }

    /** The planner's "back to the wall" action: nearest wall where the rules find no error. */
    fun alignToWall(id: String): Boolean {
        val item = project.furniture(FurnitureId(id)) ?: return false
        val aligned = aligner.alignToNearestFreeWall(item, project, analyzer) ?: return false
        project = project.withFurniture(aligned)
        return true
    }

    /** The room, its wall features and every piece with its rule report, as JSON. */
    fun stateJson(): String = buildString {
        val room = project.room
        val report = analyzer.analyze(project, settings)
        append("{\"room\":")
        points(room.shape.corners)
        append(",\"features\":[")
        features(room)
        append("],\"furniture\":[")
        project.furniture.forEachIndexed { i, item ->
            if (i > 0) append(',')
            val itemReport = report.forItem(item.id)
            append("{\"id\":").append(str(item.id.value))
            append(",\"kind\":").append(str(item.kind.name))
            append(",\"w\":").append(item.size.width)
            append(",\"d\":").append(item.size.depth)
            append(",\"x\":").append(item.placement.center.x)
            append(",\"y\":").append(item.placement.center.y)
            append(",\"rot\":").append(item.placement.rotationDegrees)
            append(",\"status\":").append(itemReport.status?.name?.let(::str) ?: "null")
            append(",\"footprint\":")
            points(item.footprint.vertices)
            append(",\"issues\":[")
            itemReport.issues.forEachIndexed { j, issue ->
                if (j > 0) append(',')
                issue(issue)
            }
            append("]}")
        }
        append("]}")
    }

    private fun update(id: String, transform: (Furniture) -> Furniture) {
        project = project.updateFurniture(FurnitureId(id), transform)
    }

    private fun clampToRoom(center: Vec2, room: Room): Vec2 {
        if (room.outline.contains(center)) return center
        return room.walls.map { it.segment.closestPointTo(center) }.minBy { it.distanceTo(center) }
    }

    private fun StringBuilder.features(room: Room) {
        val parts = mutableListOf<String>()
        room.mounted<Door>().forEach { (door, wall) ->
            parts += buildString {
                append("{\"type\":\"door\",\"id\":").append(str(door.id.value)).append(",\"span\":")
                points(listOf(wall.pointAt(door.offset), wall.pointAt(door.end)))
                append(",\"swing\":[")
                door.swingAreas(wall).forEachIndexed { i, area ->
                    if (i > 0) append(',')
                    polygon(area)
                }
                append("]}")
            }
        }
        room.mounted<Window>().forEach { (window, wall) ->
            parts += buildString {
                append("{\"type\":\"window\",\"id\":").append(str(window.id.value)).append(",\"span\":")
                points(listOf(wall.pointAt(window.offset), wall.pointAt(window.end)))
                append('}')
            }
        }
        room.mounted<Radiator>().forEach { (radiator, wall) ->
            parts += buildString {
                append("{\"type\":\"radiator\",\"id\":").append(str(radiator.id.value)).append(",\"body\":")
                polygon(radiator.body(wall))
                append(",\"zone\":")
                polygon(radiator.frontZone(wall, settings.radiatorGapCm))
                append('}')
            }
        }
        room.mounted<Stove>().forEach { (stove, wall) ->
            val face = stove.face(wall)
            val reach = wall.inwardNormal * stove.clearance
            parts += buildString {
                append("{\"type\":\"stove\",\"id\":").append(str(stove.id.value))
                append(",\"clearance\":").append(stove.clearance).append(",\"span\":")
                points(listOf(face.start, face.end))
                append(",\"zone\":")
                points(listOf(face.start, face.end, face.end + reach, face.start + reach))
                append('}')
            }
        }
        append(parts.joinToString(","))
    }

    private fun StringBuilder.issue(issue: PlacementIssue) {
        append("{\"severity\":").append(str(issue.severity.name)).append(",\"type\":")
        when (issue) {
            is OverlapsFurniture -> append("\"overlaps\",\"others\":")
                .append(issue.others.joinToString(",", "[", "]") { str(it.value) })
            is OutsideRoom -> append("\"outside\",\"depth\":").append(issue.depth)
            is TooCloseToStove -> append("\"stove\",\"distance\":").append(issue.distance)
                .append(",\"required\":").append(issue.required)
            is BlocksRadiator -> append("\"blocksRadiator\"")
            is InFrontOfRadiator -> append("\"radiatorGap\"")
            is OverhangsRadiator -> append("\"overhangsRadiator\"")
            is InDoorSwing -> append("\"doorSwing\"")
        }
        append('}')
    }

    private fun StringBuilder.polygon(polygon: ConvexPolygon) = points(polygon.vertices)

    private fun StringBuilder.points(points: List<Vec2>) {
        append('[')
        points.forEachIndexed { i, p ->
            if (i > 0) append(',')
            append('[').append(p.x).append(',').append(p.y).append(']')
        }
        append(']')
    }

    private fun str(value: String): String = "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\""

    private companion object {
        // PlannerViewModel's values, so a drag snaps from the same distance as on the phone.
        const val SNAP_DISTANCE_PX = 14.0
        const val MIN_SNAP_CM = 4.0
        const val MAX_SNAP_CM = 14.0
        const val QUARTER_TURN = 90.0
    }
}
