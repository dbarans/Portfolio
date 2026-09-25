# Luggage Please: raw inventory (project-extractor, re-analysis of the updated copy, 2026-09-25)

Source: `C:\Projects\Unity\Luggage please` (read-only). The local git has 2 snapshot commits by the owner ("Add project backup", "Update"), so there is no per-teammate blame.

Context from the owner:
- Internship at Rubens Games. The studio provided the art.
- The game was never released.
- The owner has the studio's permission to show code.
- The owner wants ONLY these 3 systems, better described. Code snippets only if presentable ("nothing to be ashamed of").
- Existing media to keep: 3 YouTube videos (suitcase `j2EKQQgl6fg`, X-ray `g5YQQ2sDoTU`, wheel `lBOSJhvBtVM`) and the screenshots `images/luggage-please/suitcase_preview.png`, `xray_previev.png`, `wheel_preview.png` and `logo.png` (key art).

## Project facts
- Unity 2022.3.36f1, URP 14.0.11 (`URP-HighFidelity` is the global default; its renderer has 7 Renderer Features).
- Legacy Input Manager; uGUI and TextMeshPro; AI Navigation (NPCs); Timeline; Easy Save 3 (third-party, not part of these systems).
- Platform: PC/Standalone, inferred from FPS mouse-look and the cursor lock.
- Scenes include `MainMenu`, `Maintnance Room` and `Main Room`, plus personal test scenes named Barbara, Dominik, Kacper, Radek and Wiktor. So there were at least 5 contributors; the team size is not confirmed.
- `Assets/Scripts` is a shared pool with no per-person folders. `Assets/Radek` holds `Tpose NPC.cs`, `NPC_Old.cs` and `Geiger Needle.cs`. `Assets/Wiktor` holds art only (the food/candy FBX files). `Assets/Dominik` now holds only `ComputerStore.cs` and some materials.

## System 1: Suitcase & item physics

### Files
| File | Lines | What it does |
|---|---|---|
| `Assets/Scripts/Luggage Scripts/Luggage.cs` | ~299 | `itemsHeld` and `allItems`; `isOpen`; `TurnOnPhysics()` / `TurnOffPhysics()` toggle useGravity, isKinematic and the colliders on every child Item; `ParentItems()` / `UnparentItems()` re-bucket items using `Physics.OverlapBox` against the case bounds; weight and overweight fee |
| `Assets/Scripts/Items/Item.cs` | ~133 | Stats plus 21 tag fields: 6 Conditions, 13 Category bools, and a `Rarity` enum with 4 values; caches `_startRotation` in Awake and exposes `GetStartRotation()` |
| `Assets/Scripts/Inspection/Luggage Animator.cs` (`LuggageAnimator`) | ~122 | Lid open and close by Slerping localRotation in Update; the anti-closure check `CheckCollisions()` |
| `Assets/Scripts/Inspection/LuggagePhysicsController.cs` | ~110 | Q key plus `luggage.isOpen` → `InspectLuggage` / `StopInspectingLuggage` → physics on or off |
| `Assets/Scripts/Inspection/LuggageTrigger.cs` | ~77 | Snaps the carried suitcase onto the inspection stand and rotates it flat |
| `Assets/Scripts/Inspection/InspectionModeInteract.cs` | ~170 | `IInteractable`: E enters inspection view on a separate camera with a Lerp/Slerp transition; Escape exits; switches the UI through `UIManager`; opens the lid on entry |
| `Assets/Scripts/Inspection/InspectionMouseInteraction.cs` | ~344 | Free manipulation, the ghost drop indicator, rotation reset |
| `Assets/Scripts/Inspection/RotateLuggage.cs` | ~54 | Lerp-rotate coroutine; duplicated in `XRayLuggageTrigger` |
| `Assets/Scripts/Player/PlayerInteraction.cs` | ~160 | World pickup and carry of the whole suitcase: raycast plus E, spring-to-hand, throw |
| `Assets/Prefabs/Luggages/p_suitcase_1.prefab`, `p_suitcase_2.prefab` | | `Upper` (lid) and `Bottom`; `LuggageAnimator.collisionLayerMask` = bits 11264 (layers 10, 11, 13) |

### How it works
**Physics only while the case is open.**
- Items stay kinematic, with no gravity and colliders off, unless the case is being inspected and is open.
- On exit, `ParentItems()` / `UnparentItems()` decide with `Physics.OverlapBox` which items are inside the case before physics is turned off again. Items cost nothing while the case is closed.

**Inspection flow.**
- `LuggageTrigger` snaps the case onto the stand.
- `InspectionModeInteract` swaps to the inspection camera and opens the lid.
- `LuggagePhysicsController` turns physics on.
- `InspectionMouseInteraction` handles the mouse.

**Free manipulation** (`InspectionMouseInteraction`):
- **LMB** raycasts and grabs an Item: gravity off, high drag. While held, `Rigidbody.AddForce` pushes the item toward the cursor's raycast hit point. This is a physics spring-follow, not a kinematic snap, and height is clamped by `pickUpHeightPoint`.
- **RMB while holding** switches to rotate mode. Mouse deltas are applied with `transform.Rotate` around the inspection camera's axes, and `angularVelocity` is zeroed every frame so physics doesn't fight the rotation.
- **Release** restores gravity and drag. Insert and remove are purely physical: whatever ends up inside the case bounds is re-parented later by the OverlapBox.

**Reset.**
- Pressing E while rotating calls `ResetRotation()`, which restores the item's orientation from `Item.GetStartRotation()` (cached in Awake).
- It resets rotation only. There is no position reset anywhere, so don't claim one.

**Visual drop indicator ("ghost").** Holding E while dragging runs `AssistInPuttingItemBack()`:
1. `CreateItemGhost()` duplicates the held item. The copy is kinematic with no gravity, all its children are moved to layer 15 "Ghost", and all its colliders become triggers.
2. `GetCollisionDistance` raymarches a `Physics.BoxCast` straight down in 0.01 m steps until it hits the first non-trigger surface under the item's bounds. The ghost snaps there, as a landing preview.
3. The ghost looks translucent only because of a dedicated URP Renderer Feature, "Ghost" (RenderObjects, Event 400, layer 15, override material). This is the same layer-plus-RenderObjects technique as the X-ray.
4. `DestroyGhost()` runs on release, rotate or drop.

**Anti-closure check** (rewritten in this copy). While the lid is closing, `CheckCollisions()` runs every frame. It calls `Physics.OverlapBox` around the lid's BoxCollider with `collisionLayerMask`, i.e. the X-ray item layers 10, 11 and 13, which excludes the case's own shell layer 12. Any hit reverses the animation, and the lid opens again.
- **Cross-system coupling:** the obstruction mask reuses the X-ray colour layers. An item prefab without an X-ray sub-layer would not block the lid.
- **Leftovers:** the old approach (`OnCollisionEnter` with compound edge colliders) left orphaned `EdgeCollider` geometry in the prefabs, plus a dead 15-line `LuggageItemCollision.cs`.

### Code quality: OK, trending better
- **Fixed:** `using static UnityEditor.Progress;` is gone from Item.cs and Luggage.cs.
- **New unused import:** `using UnityEditor;` in `InspectionMouseInteraction.cs:4`.
- **Per-frame `GetComponent`:** `LuggagePhysicsController.cs:22`, and `PlayerInteraction` `InteractionRay`.
- **Dead code:** commented-out code in `Luggage.cs:29-36` and `Luggage Animator.cs:110-120`; the dead `LuggageItemCollision.cs`.
- **Typos:** `TurnOffLugguageColliders`, `unathorisedSearch`, and the file name `Luggage Animator.cs`.
- **Public mutable lists and fields:** Luggage and Item.
- **Duplicated Lerp-rotate coroutine:** RotateLuggage vs XRayLuggageTrigger.

### Snippet candidates (verbatim)
1. **Best one.** `Assets/Scripts/Inspection/Luggage Animator.cs` lines 90–104:

```csharp
void CheckCollisions()
{
    if (boxCollider == null) return;

    Vector3 center = transform.TransformPoint(boxCollider.center);
    Vector3 size = boxCollider.size;
    Quaternion rotation = transform.rotation; 

    Collider[] hitColliders = Physics.OverlapBox(center, size / 2, rotation, collisionLayerMask);
    if (hitColliders.Length > 0 && isClosing)
    {
        isClosing = false;
        StartOpening(); 
    }
}
```

2. `Assets/Scripts/Inspection/InspectionMouseInteraction.cs` lines 219–224 (`ResetRotation`). It could be paired with `RotateItem()`, lines 186–202, for about 22 lines:

```csharp
private void ResetRotation()
{
    Quaternion startRotation = heldItem.GetComponent<Item>().GetStartRotation();
    Quaternion inspectionRotation = transform.rotation;
    heldItem.transform.rotation = startRotation * inspectionRotation * itemRotationOffset;
}
```

Avoid PlayerInteraction.cs and Item.cs as snippets.

### Visual
- **Video:** lid open and close; the anti-closure bounce-back; grab, rotate and drop; the ghost landing preview.
- **Diagram:** the inspection handoff chain; the ghost layer → RenderObjects feature.

## System 2: X-ray scanner with material differentiation

### Files
| File | Lines | What it does |
|---|---|---|
| `Assets/Prefabs/X-Ray/x-ray.prefab` | | The machine: 3 conveyor segments, a button, the x-ray plane, a snap/trigger, an orthographic scan camera, a zoom camera, and the art team's `scan.fbx` screen with the `X-RayCam.mat` override. It moved from `Assets/Dominik/Prefabs` to the shared folder in this copy |
| `Assets/Scripts/X-Ray/ConveyorBelt.cs` | 34 | Moves the Rigidbody in FixedUpdate. BUG at lines 21–33: `pos` is captured before advancing, then `MovePosition(pos)`. Do not show |
| `Assets/Scripts/X-Ray/XRayButton.cs` | 23 | `IInteractable`: runs the belt for `switchTime` in a coroutine. Has an unused VisualScripting using |
| `Assets/Scripts/X-Ray/XRayLuggageTrigger.cs` | 51 | Lerp-rotates the entering luggage flat |
| `Assets/Scripts/X-Ray/CameraFollowLuggage.cs` | 28 | NEW: while the luggage is in the trigger, shifts the scan camera's local X to track the case, clamped to −0.5..0.2 |
| `Assets/Scripts/X-Ray/ScreenXRay.cs` | 131 | NEW: `IInteractable`; zooms a perspective camera into the physical screen and switches the UI |
| `Assets/Scripts/X-Ray/XRayMouseInteraction.cs` | 40 | NEW: while zoomed, mouse raycast clicks on the on-screen `XRayButton` |
| `Assets/Art/Shaders/XRayShader.shadergraph` | | Fresnel shader exposing `_XRayColor` and `fresnel_power` |
| `Assets/Art/Materials/X-Ray/X-Ray.mat` (other, teal), `X-Ray Metal.mat` (brown/orange), `X-Ray Organic.mat` (yellow/khaki, NEW), `X-Ray Luggage.mat` (shell, translucent teal), `X-RayCam.mat` | | `X-RayCam.mat` samples the render texture as both base and emission map: the in-world screen |
| `Assets/Art/Textures/X-Ray/X-RayTexture.renderTexture` | | 1024×1024, HDR, MSAA×2 |
| `ProjectSettings/TagManager.asset` | | Layers 10 X-Ray, 11 X-Ray Metal, 12 X-Ray Luggage, 13 X-Ray Organic, 15 Ghost |

### How it works
The system is configuration, not C#: no code assigns categories at runtime.
1. Item sub-meshes are hand-tagged with one of the X-ray layers. 27 item prefabs carry X-ray layers. Mixed-material props such as the drone are split per sub-mesh.
2. Four URP `RenderObjects` Renderer Features (XRay, XRay Metal, XRay Organic, XRay Luggage) each filter exactly one layer and set an override material that uses the shared fresnel shader with a different `_XRayColor`. They all run at Event 1000.
3. A small orthographic scan camera (size 0.7, near 1, far 3.3) has a culling mask of exactly layers 10–13 (bits 15360). It renders into the 1024² render texture, which `X-RayCam.mat` shows on the console model's screen.
4. The belt is started by a button press. The luggage trigger rotates the case flat. The scan camera follows the case across the beam (`CameraFollowLuggage`).
5. The player can press E on the screen to zoom into the console and then click the belt button with the mouse (`ScreenXRay` + `XRayMouseInteraction`).

Four colour categories: other, metal, organic, plus the case shell.

Unverified: the main player camera renders Everything, and the X-ray features have no camera override. It is not confirmed whether the stencil settings stop the tint from appearing in normal gameplay view. Do not claim per-camera scoping.

The art team made the scanner model (`scan.fbx`, by Yelyzaveta) and the food models (by Wiktor).

### Code quality: OK
- The new scripts (`ScreenXRay`, `CameraFollowLuggage`, `XRayMouseInteraction`) are clean.
- `ConveyorBelt` has a bug.
- There is an unused using in `XRayButton`.

### Snippet candidates
1. `Assets/Scripts/X-Ray/CameraFollowLuggage.cs` lines 12–27 (`OnTriggerStay` + `UpdateCameraPosition`), about 15 lines.
2. `Assets/Scripts/X-Ray/ScreenXRay.cs` lines 49–74 (`ZoomIn`), 26 lines.

Most of the interesting part is configuration, so show it as a diagram: item sub-mesh → layer → URP RenderObjects feature (override material) → ortho scan camera (culling mask) → RenderTexture → screen material.

### Visual
- The false-colour screen: `xray_previev.png` plus the video.
- A suitcase crossing the belt with the screen updating.
- The zoom-in-and-click flow.

## System 3: Contextual interaction wheel (DialogWheel)

### Files
| File | Lines | What it does |
|---|---|---|
| `Assets/Scripts/DialogWheel/DialogWheel.cs` | ~174 | Wheel controller: show and hide, positions segments on a circle, click and hover, selection state |
| `Assets/Scripts/DialogWheel/DialogWheelSegment.cs` | ~61 | Per-segment data (`Title`, `Description`, `Id`, `Icon`, `AngleStart` / `AngleEnd`); well encapsulated |
| `Assets/Scripts/DialogWheel/DialogWheelOptionData.cs` | ~10 | ScriptableObject with 0 instances and `SetData` never called: dead scaffolding |
| `Assets/Scripts/DialogWheel/DialogManager.cs` | ~43 | Typewriter message box (`ShowMessag`, sic) |
| `Assets/Scripts/NPC/NPC Interactions.cs` (`NPCInteractions`) | ~265 | The context logic: which options appear, per NPC state, and what each one does |
| `Assets/Scripts/ReferenceManager/ReferenceManager.cs` | ~74 | Singleton service locator exposing about 25 scene references; the new systems all use it |
| `Assets/Prefabs/DialogWheel.prefab` | | uGUI Canvas with 7 pre-built segments (ShowTicket, Metal Detector, Weighing Area, T-Pose, Weight fine, Overweight fee, CheckOut) and a `SegmentTitleText` (TMP) |

### How it works
- **Technology:** pure uGUI. Each segment has `DialogWheelSegment`, `Button` (click), `EventTrigger` (PointerEnter/Exit → hover), `Image` (icon) and `Outline` (hover highlight).
- **Showing options:** `ShowDialogOptions(List<int> ids)` hides all segments, then for each requested id finds the pre-built segment, re-wires `onClick`, activates it and positions it with trigonometry. The circle is always split evenly as `360 / count`, so 2 options give halves and 4 give quarters. Radius is 330 px.
- **Context** (`NPCInteractions.Interact()`): switches on `NPC.State` (8 airport states) and builds a different option list per checkpoint:
  - Queue → ShowTicket.
  - BaggageDrop → ShowTicket, SendToMetalDetector, SendToWaitingArea.
  - MetalDetectorGate → ShowTicket, SendToWeighingArea, RequestTPose, SendToWaitingArea.
  - BaggageWeighing → ShowTicket, ConfirmLuggageWeight, SendToWaitingArea, plus HandleOverweightLuggage, but only if that NPC's luggage is on the scale.

  After the list is built: `WaitUntil` the player selects → `InteractionSwitch`.
- **Where it is used:** only for NPC dialogue, so "context" means where the passenger is in the airport flow. It is not used on the suitcase or the X-ray.
- **Input:** EventSystem (onClick, EventTrigger). E key-up closes the wheel. Opening the wheel freezes camera look and movement and unlocks the cursor.
- **Coupling:** the T-Pose option calls `TposeNPC` (`Assets/Radek/Scripts/Tpose NPC.cs`), a teammate's component. Credit it if it's mentioned.

### Numbers
- 7 options and 7 segments.
- 8 NPC states; 4 of them are still TODO stubs.
- The wheel is invoked from 1 class.
- Radius is 330 px.

### Code quality
OK, leaning good for `DialogWheel.cs` and `DialogWheelSegment.cs`. Weaker for `NPCInteractions.cs`:
- an unused VisualScripting using;
- a 6-line pattern copy-pasted across 4 handlers;
- the magic number `Add(6)`;
- TODO stubs;
- the `ShowMessag` typo.

### Snippet candidates
1. **Best one.** `Assets/Scripts/DialogWheel/DialogWheel.cs` lines 100–123 (`PositionDialogSegment` + `CalculateSegmentPosition`):

```csharp
    private void PositionDialogSegment(GameObject segment, int index, int totalSegments)
    {
        float angleStep = 360f / totalSegments;
        float angleStart = angleStep * index;
        float angleEnd = angleStep * (index + 1);

        var dialogWheelFragment = segment.GetComponent<DialogWheelSegment>();
        dialogWheelFragment.SetAngle(angleStart, angleEnd);

        Vector2 position = CalculateSegmentPosition(angleStart, angleEnd);
        segment.GetComponent<RectTransform>().anchoredPosition = position;
    }

    private Vector2 CalculateSegmentPosition(float angleStart, float angleEnd)
    {
        float middleAngle = (angleStart + angleEnd) / 2f;
        float angleRad = middleAngle * Mathf.Deg2Rad;
        float radius = 330f;

        float posX = Mathf.Cos(angleRad) * radius;
        float posY = Mathf.Sin(angleRad) * radius;

        return new Vector2(posX, posY);
    }
```

2. `NPCInteractions.QueueInteraction()` lines 142–155, the shortest clean instance of the pattern. Otherwise avoid `NPCInteractions`.

### Visual
- **Video:** opening the wheel on an NPC; hover; picking an option; different option sets per checkpoint.
- **Diagram:** NPC state → option list → `ShowDialogOptions` → select → action.
