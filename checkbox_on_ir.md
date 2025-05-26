# How to make a checkbox selector for Interactive Reports  on Oracle APEX 24.2<br/>
### Como fazer seletor para Relatórios Interativos no APEX 24.2
```diff
First thing, you're going to create a virtual column on your query, like that: 
# Primeiro, você vai criar uma coluna virtual na sua consulta:
```
` SQL `
```sql
  apex_item.checkbox(1, pk_id) as checkbox 
```

```diff
Where pk_id is your table's primary_key column.
# Onde pk_id é a chave primária da sua tabela.

Then you're going to rename the column heading to this:

```
` HTML `
```html
<input 
   type  = "checkbox"
   id    = "selectunselectall" 
   class = "centered-checkbox"

/>
```

The id will be the key to the javascript code, while type and class will allow you to style your checkbox properly: 
` CSS `
```css
th input.centered-checkbox {
  display:         block;
  margin:          0 auto;
  font-size:       12px;
  justify-content: center;  /* Horizontal centering */
  align-items:     center;  /* Vertical centering */
}


input[type="checkbox"][name="f01"] {
  width:  11px!important;
  height: 11px!important;
}
```
```diff
For the javascript, you can use the following snippet to put on your global.js file on Static Workspace/Application Files: 
```
` JS `
```js
function setupCheckboxManager({
  itemName,          // e.g., "P1_SELECTED_IDS"
  checkboxName,      // e.g., "f01"
  selectAllCheckbox  // e.g., "#selectunselectall"
})  // This first part you'll use on "Execute when page loads", replacing the parameters with the respective values and, of course, putting a ";" at the end ;)

{
  const $ = apex.jQuery;

  function getSessionValues() {
    const val = apex.item(itemName).getValue();
    return val ? val.split(':') : [];
  }

  function setSessionValues(values) {
    apex.item(itemName).setValue(values.join(':'));
    console.debug(`[${itemName}] Updated session value:`, values.join(':'));
  }

  function updateCheckedValues() {
    const checkedValues = $(`input[name='${checkboxName}']:checked:visible`).map(function() { return $(this).val(); }).get();
    setSessionValues(checkedValues);
  }

  function updateSelectAllState() {
    const totalVisible = $(`input[name='${checkboxName}']:visible`).length;
    const checkedVisible = $(`input[name='${checkboxName}']:checked:visible`).length;
    $(selectAllCheckbox).prop('checked', totalVisible > 0 && totalVisible === checkedVisible);
  }

  function bindCheckboxEvents() {
    // "Select All" checkbox click handler
    $(selectAllCheckbox).off('click').on('click', function() {
      const check = $(this).is(':checked');
      $(`input[name='${checkboxName}']:visible`).each(function() {        $(this).prop('checked', check);
      });
      updateCheckedValues();
    });

    // Individual checkbox click handler
    $(document).off('click', `input[name='${checkboxName}']`).on('click', `input[name='${checkboxName}']`, function() {
      updateCheckedValues();
      updateSelectAllState();
    });
  }

  function restoreCheckboxStates() {
    const checkedValues = getSessionValues();
    $(`input[name='${checkboxName}']:visible`).each(function() {
      $(this).prop('checked', checkedValues.includes($(this).val()));
    });
    updateSelectAllState();
  }

  // Initialization
  $(document).ready(function() {
    restoreCheckboxStates();
    bindCheckboxEvents();
  });


  // On region refresh
  $(document).on('apexafterrefresh', function() {
    restoreCheckboxStates();
    bindCheckboxEvents();
  });
}
```
