# setState API Documentation

## Overview

The `setState` API is a robust, object-oriented solution for managing the state of items and regions in APEX applications. It is designed to simplify the manipulation of user interface elements, promoting consistency and reducing the amount of boilerplate code required for common tasks such as hiding, showing, locking, unlocking, making required or not required, and even managing column layouts.

files: [.js](https://github.com/andreiluizf/oracleapex/blob/main/setState.js) | [.css](https://github.com/andreiluizf/oracleapex/blob/main/setState.css)


### Fundamental Concepts

*   **Item**: Refers to an APEX form item (e.g., text fields, selects, checkboxes, etc.). The `setState` API allows you to control the visual and interactive state of these items.
*   **Region**: Refers to an APEX region (e.g., static regions, interactive reports, forms, etc.). The `setState` API provides functionality to manage the visibility, locking, and layout of these regions.
*   **State**: Represents the dynamic properties of an item or region, such as `hidden`, `locked`, `required`, and `disabled`. The API allows you to change these states programmatically.
*   **Options (opts)**: An optional configuration object that can be passed to the `item` and `region` methods to customize behavior, such as `clearOnHide` or `animationDuration`.

### Basic Usage

To start using the `setState` API, make sure the JavaScript file (`setState_refactored.js`) is included in your APEX application. The API is exposed globally through the `setState` object.

```javascript
// Example: Hide an item and lock a region
setState.item('P1_MY_ITEM', { hidden: true });
setState.region('MY_REGION', { locked: true });

// Example: Show an item and make it required
setState.item('P1_ANOTHER_ITEM', { hidden: false, required: true });
```

The API supports method chaining, allowing for concise operations:

```javascript
setState
    .item('P1_ITEM_A', { hidden: true })
    .region('REGION_B', { locked: true });
```

## API Reference

The `setState` API is organized into methods that allow you to control the state of items and regions in a granular or batch manner.

### `setState.item(items, opts)`

Sets the state of one or more APEX items.

*   **`items`** (`string` or `string[]`): The ID of the item or an array of item IDs to be modified.
*   **`opts`** (`Object`, optional): A configuration object with the following properties:
    *   `hidden` (`boolean`): If `true`, hides the item. If `false`, shows the item.
    *   `locked` (`boolean`): If `true`, locks the item (makes it read-only and disables interactions). If `false`, unlocks the item.
    *   `required` (`boolean`): If `true`, makes the item required. If `false`, makes the item not required.
    *   `clearOnHide` (`boolean`, default: `false`): If `true` and the item is hidden, its value will be cleared.
    *   `onStateChange` (`function`): A callback function to be executed after the item's state changes. Receives the item ID and its new state as arguments.

**Example:**

```javascript
// Hide an item and clear its value
setState.item("P1_ITEM_NAME", { hidden: true, clearOnHide: true });

// Lock multiple items
setState.item(["P1_ITEM_A", "P1_ITEM_B"], { locked: true });

// Make an item required and execute a callback
setState.item("P1_EMAIL", { 
    required: true,
    onStateChange: function(itemId, state) {
        console.log(`Item ${itemId} is now required: ${state.required}`);
    }
});
```

### `setState.region(ids, opts)`

Sets the state of one or more APEX regions.

*   **`ids`** (`string`, `string[]`, or `jQuery`): The ID of the region, an array of region IDs, or a jQuery object representing the region(s) to be modified.
*   **`opts`** (`Object`, optional): A configuration object with the following properties:
    *   `hidden` (`boolean`): If `true`, hides the region. If `false`, shows the region.
    *   `locked` (`boolean`): If `true`, locks the region (disables interactions). If `false`, unlocks the region.
    *   `collapseColumn` (`boolean`, default: `true`): If `true` and the region is hidden, the column containing it will also be collapsed.
    *   `clearOnHide` (`boolean`, default: `false`): If `true` and the region is hidden, the `clearFn` function will be called to clear its content.
    *   `clearFn` (`function`): A callback function to clear the region's content when `clearOnHide` is `true`. Receives the region ID as an argument.
    *   `centerIcon` (`boolean`, default: `false`): If `true` and the region is locked, the lock icon will be centered.
    *   `onStateChange` (`function`): A callback function to be executed after the region's state changes. Receives the region ID and its new state as arguments.

**Example:**

```javascript
// Hide a region
setState.region("MY_REPORT_REGION", { hidden: true });

// Lock a region and center the icon
setState.region("MY_FORM_REGION", { locked: true, centerIcon: true });

// Show multiple regions
setState.region(["REGION_A", "REGION_B"], { hidden: false });
```

### `setState.batch`

Allows you to apply multiple state operations to items or regions at once.

#### `setState.batch.items(operations)`

Applies multiple states to items.

*   **`operations`** (`Object`): An object where the keys are the item IDs and the values are the configuration objects (`opts`) for each item.

**Example:**

```javascript
setState.batch.items({
    "P1_FIRST_NAME": { hidden: true, clearOnHide: true },
    "P1_LAST_NAME": { locked: true },
    "P1_AGE": { required: true }
});
```

#### `setState.batch.regions(operations)`

Applies multiple states to regions.

*   **`operations`** (`Object`): An object where the keys are the region IDs and the values are the configuration objects (`opts`) for each region.

**Example:**

```javascript
setState.batch.regions({
    "HEADER_REGION": { hidden: true },
    "FOOTER_REGION": { locked: true, centerIcon: true }
});
```

### `setState.get`

Allows you to get the current state of an item or region.

#### `setState.get.item(itemId)`

Returns the current state of an item.

*   **`itemId`** (`string`): The ID of the item.
*   **Returns**: An object with the properties `hidden`, `locked`, `required`, `disabled`, and `exists`.

**Example:**

```javascript
const itemState = setState.get.item("P1_MY_ITEM");
if (itemState.hidden) {
    console.log("The item is hidden.");
}
```

#### `setState.get.region(regionId)`

Returns the current state of a region.

*   **`regionId`** (`string`): The ID of the region.
*   **Returns**: An object with the properties `hidden`, `locked`, `disabled`, and `exists`.

**Example:**

```javascript
const regionState = setState.get.region("MY_REGION");
if (regionState.locked) {
    console.log("The region is locked.");
}
```

### `setState.toggle`

Allows you to toggle the state of a property of an item or region.

#### `setState.toggle.item(itemId, property)`

Toggles the boolean value of an item property.

*   **`itemId`** (`string`): The ID of the item.
*   **`property`** (`string`): The property to be toggled (e.g., `"hidden"`, `"locked"`, `"required"`).

**Example:**

```javascript
// Toggle the visibility of an item
setState.toggle.item("P1_DETAILS", "hidden");
```

#### `setState.toggle.region(regionId, property)`

Toggles the boolean value of a region property.

*   **`regionId`** (`string`): The ID of the region.
*   **`property`** (`string`): The property to be toggled (e.g., `"hidden"`, `"locked"`).

**Example:**

```javascript
// Toggle the lock state of a region
setState.toggle.region("EDIT_FORM", "locked");
```

### `setState.hide`

Shortcuts for hiding items or regions.

#### `setState.hide.item(itemId, opts)`

Hides an item. Equivalent to `setState.item(itemId, { hidden: true, ...opts })`.

#### `setState.hide.region(regionId, opts)`

Hides a region. Equivalent to `setState.region(regionId, { hidden: true, ...opts })`.

**Example:**

```javascript
setState.hide.item("P1_SECRET_FIELD");
setState.hide.region("ADMIN_PANEL");
```

### `setState.show`

Shortcuts for showing items or regions.

#### `setState.show.item(itemId, opts)`

Shows an item. Equivalent to `setState.item(itemId, { hidden: false, ...opts })`.

#### `setState.show.region(regionId, opts)`

Shows a region. Equivalent to `setState.region(regionId, { hidden: false, ...opts })`.

**Example:**

```javascript
setState.show.item("P1_PUBLIC_FIELD");
setState.show.region("USER_DASHBOARD");
```

### `setState.lock`

Shortcuts for locking items or regions.

#### `setState.lock.item(itemId, opts)`

Locks an item. Equivalent to `setState.item(itemId, { locked: true, ...opts })`.

#### `setState.lock.region(regionId, opts)`

Locks a region. Equivalent to `setState.region(regionId, { locked: true, ...opts })`.

**Example:**

```javascript
setState.lock.item("P1_READONLY_DATA");
setState.lock.region("SUMMARY_INFO");
```

### `setState.unlock`

Shortcuts for unlocking items or regions.

#### `setState.unlock.item(itemId, opts)`

Unlocks an item. Equivalent to `setState.item(itemId, { locked: false, ...opts })`.

#### `setState.unlock.region(regionId, opts)`

Unlocks a region. Equivalent to `setState.region(regionId, { locked: false, ...opts })`.

**Example:**

```javascript
setState.unlock.item("P1_EDITABLE_FIELD");
setState.unlock.region("DETAIL_FORM");
```

### `setState.require`

Shortcut for making an item required.

#### `setState.require.item(itemId, opts)`

Makes an item required. Equivalent to `setState.item(itemId, { required: true, ...opts })`.

**Example:**

```javascript
setState.require.item("P1_MANDATORY_FIELD");
```

### `setState.unrequire`

Shortcut for making an item not required.

#### `setState.unrequire.item(itemId, opts)`

Makes an item not required. Equivalent to `setState.item(itemId, { required: false, ...opts })`.

**Example:**

```javascript
setState.unrequire.item("P1_OPTIONAL_FIELD");
```

### `setState.restore`

Allows you to restore items or regions to their original state (the state they were in when the page was loaded or when the original state was first saved).

#### `setState.restore.item(items)`

Restores one or more items to their original state.

*   **`items`** (`string` or `string[]`): The ID of the item or an array of item IDs to be restored.

**Example:**

```javascript
setState.restore.item("P1_FORM_FIELD");
setState.restore.item(["P1_FIELD_A", "P1_FIELD_B"]);
```

#### `setState.restore.region(regions)`

Restores one or more regions to their original state.

*   **`regions`** (`string` or `string[]`): The ID of the region or an array of region IDs to be restored.

**Example:**

```javascript
setState.restore.region("MY_DYNAMIC_REGION");
```

### `setState.layout`

Manages column layouts, allowing you to collapse and expand items/regions with animations.

#### `setState.layout.collapseExpand(item1, collapseSizeOrHide, item2, expandSize, opts)`

Allows you to collapse one item/region and expand another, adjusting their column classes and applying animations.

*   **`item1`** (`string`): The ID of the first item or region whose column will be affected (collapsed or resized).
*   **`collapseSizeOrHide`** (`number` or `boolean`): Can be an integer (from 1 to 12) to set the column size of `item1`, or `true` / `"hide"` to completely hide the column of `item1`. The conversion to the `col-X` CSS class is done internally.
*   **`item2`** (`string`): The ID of the second item or region whose column will be expanded.
*   **`expandSize`** (`number`): An integer (from 1 to 12) to set the column size of `item2`. The conversion to the `col-X` CSS class is done internally.
*   **`opts`** (`Object`, optional): A configuration object with the following properties:
    *   `colSelector` (`string`, default: `COL_WRAP`): CSS selector to identify the column wrappers.
    *   `animate` (`boolean`, default: `false`): If `true`, applies transition animations.
    *   `duration` (`number`, default: `250`): Animation duration in milliseconds.
    *   `easing` (`string`, default: `"ease"`): CSS easing function for the animation.

**Example:**

```javascript
// Collapse P1_ITEM_A to col-6 and expand P1_ITEM_B to col-12 with animation
setState.layout.collapseExpand("P1_ITEM_A", 6, "P1_ITEM_B", 12, { animate: true });

// Hide P1_ITEM_C and expand P1_ITEM_D to col-12
setState.layout.collapseExpand("P1_ITEM_C", true, "P1_ITEM_D", 12);
```

### `setState.snapshot`

Allows you to create and restore "snapshots" of the current state of items and regions.

#### `setState.snapshot.create(itemIds = [], regionIds = [])`

Creates a snapshot object containing the current state of the specified items and regions.

*   **`itemIds`** (`string[]`, default: `[]`): An array of item IDs to include in the snapshot.
*   **`regionIds`** (`string[]`, default: `[]`): An array of region IDs to include in the snapshot.
*   **Returns**: An object containing the creation `timestamp` and the states of the specified `items` and `regions`.

**Example:**

```javascript
// Create a snapshot of the state of an item and a region
const mySnapshot = setState.snapshot.create(["P1_FIELD_STATUS"], ["DETAIL_SECTION"]);
console.log(mySnapshot);
/*
{
    timestamp: "2023-10-27T10:00:00.000Z",
    items: {
        "P1_FIELD_STATUS": { hidden: false, locked: false, required: true, disabled: false, exists: true }
    },
    regions: {
        "DETAIL_SECTION": { hidden: false, locked: false, disabled: false, exists: true }
    }
}
*/
```

#### `setState.snapshot.restore(snapshot)`

Restores the state of items and regions from a previously created snapshot object.

*   **`snapshot`** (`Object`): The snapshot object to be restored.

**Example:**

```javascript
// Restore the state from a snapshot
setState.snapshot.restore(mySnapshot);
```

### `setState.conditional(conditions)`

Allows you to define conditional rules to change the state of items and regions based on the value of an APEX item. This is useful for creating dynamic behaviors in the user interface.

*   **`conditions`** (`Object`): An object where the keys are the IDs of the APEX items that will act as triggers, and the values are arrays of rules.
    *   Each rule (`vo_rule`) is an object with the following properties:
        *   `operator` (`string`): The comparison operator (e.g., `"="`, `"!="`, `"contains"`, `"empty"`, `"notEmpty"`).
        *   `value` (`any`): The value to be compared (not applicable for `"empty"` and `"notEmpty"`).
        *   `actions` (`Array`): An array of actions to be executed if the condition is true.
            *   Each action (`vo_action`) is an object with the following properties:
                *   `type` (`string`): The type of element to be affected (`"item"` or `"region"`).
                *   `target` (`string`): The ID of the target item or region.
                *   `state` (`Object`): The state object (`opts`) to be applied to the target.

**Example:**

```javascript
// Define conditional rules for the P1_STATUS item
setState.conditional({
    "P1_STATUS": [
        { // If P1_STATUS is "COMPLETED"
            operator: "=",
            value: "COMPLETED",
            actions: [
                { type: "item", target: "P1_COMPLETION_DATE", state: { hidden: false, required: true } },
                { type: "region", target: "COMPLETION_DETAILS", state: { hidden: false } }
            ]
        },
        { // If P1_STATUS is not "COMPLETED"
            operator: "!=",
            value: "COMPLETED",
            actions: [
                { type: "item", target: "P1_COMPLETION_DATE", state: { hidden: true, required: false, clearOnHide: true } },
                { type: "region", target: "COMPLETION_DETAILS", state: { hidden: true } }
            ]
        },
        { // If P1_STATUS is "PENDING"
            operator: "=",
            value: "PENDING",
            actions: [
                { type: "item", target: "P1_REASON", state: { hidden: false, required: true } }
            ]
        },
        { // If P1_STATUS is not "PENDING"
            operator: "!=",
            value: "PENDING",
            actions: [
                { type: "item", target: "P1_REASON", state: { hidden: true, required: false, clearOnHide: true } }
            ]
        }
    ]
});

// This example will cause:
// - If P1_STATUS is 'COMPLETED', P1_COMPLETION_DATE and the COMPLETION_DETAILS region will be shown and P1_COMPLETION_DATE will be required.
// - If P1_STATUS is not 'COMPLETED', P1_COMPLETION_DATE and COMPLETION_DETAILS will be hidden and P1_COMPLETION_DATE will be cleared and not required.
// - If P1_STATUS is 'PENDING', P1_REASON will be shown and required.
// - If P1_STATUS is not 'PENDING', P1_REASON will be hidden, cleared, and not required.
```

## Use Case Examples

This section demonstrates how the `setState` API can be used to solve common UI problems in APEX applications.

### Use Case 1: Dynamic Form Based on Selection

Imagine a form where the visibility of certain fields depends on the selection of an item type.

```javascript
// In the change event of the P1_ITEM_TYPE item
apex.item("P1_ITEM_TYPE").change(function() {
    const itemType = this.getValue();

    if (itemType === "PRODUCT") {
        setState.show.item("P1_PRODUCT_DETAILS");
        setState.hide.item("P1_SERVICE_DETAILS", { clearOnHide: true });
    } else if (itemType === "SERVICE") {
        setState.show.item("P1_SERVICE_DETAILS");
        setState.hide.item("P1_PRODUCT_DETAILS", { clearOnHide: true });
    } else {
        setState.hide.item(["P1_PRODUCT_DETAILS", "P1_SERVICE_DETAILS"], { clearOnHide: true });
    }
});

// To initialize the state on page load
$(document).ready(function() {
    apex.item("P1_ITEM_TYPE").trigger("change");
});
```

### Use Case 2: Locking a Region During Processing

Lock an entire region to prevent user interactions while an asynchronous operation is in progress.

```javascript
// Before starting an AJAX call or long process
setState.lock.region("MY_DATA_ENTRY_REGION", { centerIcon: true });

// After the AJAX call or process is complete
// (Example with Promise)
myAsyncProcess().then(function() {
    setState.unlock.region("MY_DATA_ENTRY_REGION");
}).catch(function(error) {
    console.error("Error in process: ", error);
    setState.unlock.region("MY_DATA_ENTRY_REGION"); // Unlock even in case of error
});
```

### Use Case 3: Responsive Layout with Collapse/Expand

Toggle the column layout to optimize screen space, for example, when focusing on a specific section.

```javascript
// Button to expand the details region and collapse the summary region
$("#BTN_SHOW_DETAILS").on("click", function() {
    setState.layout.collapseExpand("SUMMARY_REGION", 4, "DETAIL_REGION", 8, { animate: true });
});

// Button to restore the original layout
$("#BTN_RESET_LAYOUT").on("click", function() {
    setState.restore.layout("SUMMARY_REGION", "DETAIL_REGION");
});
```

### Use Case 4: Saving and Restoring Form State

Use snapshots to save the state of a form before an operation and restore it if necessary.

```javascript
let formSnapshot;

// Save the form state before opening a confirmation modal
$("#BTN_SAVE_FORM").on("click", function() {
    formSnapshot = setState.snapshot.create(
        ["P1_FIELD_A", "P1_FIELD_B"], 
        ["FORM_REGION_1", "FORM_REGION_2"]
    );
    // Open confirmation modal
    openConfirmationModal();
});

// If the user cancels the operation in the modal
$("#BTN_CANCEL_CONFIRMATION").on("click", function() {
    if (formSnapshot) {
        setState.snapshot.restore(formSnapshot);
    }
    closeConfirmationModal();
});
```

## Legacy Compatibility

To ensure backward compatibility with previous versions of the API, the following global functions are still available, but their use is **discouraged** in new developments. It is recommended to migrate to the equivalent methods of the `setState` object to take advantage of the object-oriented structure and future improvements.

| Legacy Function             | `setState` Equivalent                                  |
| :------------------------ | :------------------------------------------------------ |
| `setItemState(items, opts)` | `setState.item(items, opts)`                            |
| `setRegionState(ids, opts)` | `setState.region(ids, opts)`                            |
| `hideItem(itemId, opts)`    | `setState.hide.item(itemId, opts)`                      |
| `showItem(itemId, opts)`    | `setState.show.item(itemId, opts)`                      |
| `lockItem(itemId, opts)`    | `setState.lock.item(itemId, opts)`                      |
| `unlockItem(itemId, opts)`  | `setState.unlock.item(itemId, opts)`                    |
| `requireItem(itemId, opts)` | `setState.require.item(itemId, opts)`                   |
| `unrequireItem(itemId, opts)` | `setState.unrequire.item(itemId, opts)`                 |
| `hideRegion(regionId, opts)` | `setState.hide.region(regionId, opts)`                  |
| `showRegion(regionId, opts)` | `setState.show.region(regionId, opts)`                  |
| `lockRegion(regionId, opts)` | `setState.lock.region(regionId, opts)`                  |
| `unlockRegion(regionId, opts)` | `setState.unlock.region(regionId, opts)`                |
| `getItemState(itemId)`      | `setState.get.item(itemId)`                             |
| `getRegionState(regionId)`  | `setState.get.region(regionId)`                         |
| `toggleItemState(itemId, property)` | `setState.toggle.item(itemId, property)`                |
| `toggleRegionState(regionId, property)` | `setState.toggle.region(regionId, property)`            |
| `restoreOriginalState(items, type)` | `setState.restore.item(items)` or `setState.restore.region(items)` |
| `batchStateChange(operations, type)` | `setState.batch.items(operations)` or `setState.batch.regions(operations)` |
| `createStateSnapshot(itemIds, regionIds)` | `setState.snapshot.create(itemIds, regionIds)`          |
| `restoreFromSnapshot(snapshot)` | `setState.snapshot.restore(snapshot)`                   |
| `collapseAndExpand(...)`    | `setState.layout.collapseExpand(...)`                   |
| `restoreLayout(sourceId, targetId)` | `setState.restore.layout(sourceId, targetId)`           |
