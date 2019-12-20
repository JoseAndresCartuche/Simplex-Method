const {
    MDCComponent
} = mdc.base;

const DATATABLE_COLUMNS_SELECTOR = `.mdc-data-table__content thead`,
    DATATABLE_DATA_SELECTOR = `.mdc-data-table__content tbody`,
    DATATABLE_SORTABLE_SELECTOR = `.mdc-data-table--sortable`,
    DATATABLE_COLUMNS_NUMERIC = `mdc-data-table--numeric`,
    DATATABLE_COLUMNS_SORTABLE = `mdc-data-table--sortable`,
    DATATABLE_COLUMNS_SORT_ASC = `mdc-data-table--sort-asc`,
    DATATABLE_COLUMNS_SORT_DESC = `mdc-data-table--sort-desc`;

class MDCDataTable extends MDCComponent {

    static attachTo(root) {
        return new MDCDataTable(root);
    }
  
    get columns() {
        return this.foundation_.columns;
    }

    set columns(columns) {
        if (Array.isArray(columns)) {
            this.foundation_.setColumns(columns);
        } else {
            throw new Error(`Expected an array`);
        }
    }

    get data() {
        return this.foundation_.data;
    }

    set data(data) {
        if (Array.isArray(data)) {
            this.foundation_.setData(data);
        } else {
            throw new Error(`Expected an array`);
        }
    }

    getDefaultFoundation() {

        const getHeaderRow = () => {
                let thead = this.root_.querySelector(DATATABLE_COLUMNS_SELECTOR),
                    row = thead.querySelector(`tr`);
                if (!row) {
                    row = document.createElement(`tr`);
                    row.setAttribute(`role`, `rowheader`);
                    thead.appendChild(row);
                }
                return row;
            },
            getHeaderColumns = () => {
                return getHeaderRow().querySelectorAll(`th`);
            },
            emptyHeaderColumns = () => {
                getHeaderRow().remove();
            },
            getData = () => {
                return this.root_.querySelector(DATATABLE_DATA_SELECTOR);
            },
            getDataRows = () => {
                return getData().querySelectorAll(`tr`);
            },
            emptyData = () => {
                Array.prototype.map.call(getDataRows(), row => {
                    row.remove();
                });
            };

        return new MDCDataTableFoundation({
            registerSortClickHandler: (handler) => this.root_.addEventListener(`click`, handler),
            deregisterSortClickHandler: (handler) => this.root_.removeEventListener(`click`, handler),
            // Reads the columns list
            readColumns: () => {
                var cols = getHeaderColumns();
                return Array.prototype.map.call(cols, col => {
                    return {
                        text: col.textContent,
                        description: col.getAttribute(`aria-label`),
                        numeric: col.classList.contains(DATATABLE_COLUMNS_NUMERIC),
                        sortable: col.classList.contains(DATATABLE_COLUMNS_SORTABLE),
                        sort: col.classList.contains(DATATABLE_COLUMNS_SORT_ASC) ? 1 : col.classList.contains(DATATABLE_COLUMNS_SORT_DESC) ? -1 : 0
                    };
                });
            },
            // Edit the columns
            setColumns: (cols) => {
                emptyHeaderColumns();
                let row = getHeaderRow();
                cols.forEach(col => {
                    let column = document.createElement(`th`);
                    column.setAttribute(`role`, `columnheader`)
                    // Add text
                    column.textContent = col.text;
                    column.setAttribute(`aria-label`, col.description);
                    // Numeric
                    if (col.numeric) {
                        column.classList.add(DATATABLE_COLUMNS_NUMERIC);
                    }
                    // Sort
                    if (col.sortable) {
                        let ariaSort = `none`;
                        column.classList.add(DATATABLE_COLUMNS_SORTABLE);
                        if (col.sort === `asc` || col.sort === 1) {
                            ariaSort = `ascending`;
                            column.classList.add(DATATABLE_COLUMNS_SORT_ASC);
                        } else if (col.sort === `desc` || col.sort === -1) {
                            ariaSort = `descending`;
                            column.classList.add(DATATABLE_COLUMNS_SORT_DESC);
                        }
                        column.setAttribute(`aria-sort`, ariaSort);
                    }
                    // Add to cols
                    row.appendChild(column);
                });
            },
            // Read data
            readData: () => {
                var rows = getDataRows();
                return Array.prototype.map.call(rows, row => {
                    let cells = row.querySelectorAll(`td`);
                    return Array.prototype.map.call(cells, cell => cell.textContent);
                });
            },
            // Edit the data
            setData: (data) => {
                emptyData();
                let element = getData();
                // Sorting data
                let column = this.columns.find(el => el.sort);
                if (column) {
                    let index = this.columns.indexOf(column);
                    if (column.sortable) {
                        let f = (params => {
                            if (params.sort === `desc` || params.sort === -1) {
                                return params.numeric ? (a, b) => b[index] - a[index] : (a, b) => b[index].localeCompare(a[index]);
                            } else {
                                return params.numeric ? (a, b) => a[index] - b[index] : (a, b) => a[index].localeCompare(b[index]);
                            }
                        })(column);
                        data.sort(f);
                    }
                }
                // For each data
                data.forEach(d => {
                    // Create a new row
                    let row = document.createElement(`tr`);
                    row.setAttribute(`role`, `row`);
                    // For each values
                    d.forEach((val, i) => {
                        // Create a new cell
                        let cell = document.createElement(`td`);
                        cell.setAttribute(`role`, `gridcell`);
                        // Add numeric if needed
                        if (this.columns[i].numeric) {
                            cell.classList.add(DATATABLE_COLUMNS_NUMERIC);
                        }
                        // Add content
                        if (val instanceof Element) {
                            cell.appendChild(val);
                        } else {
                            cell.textContent = val;
                        }
                        row.appendChild(cell);
                    });
                    // Add to cols
                    element.appendChild(row);
                });
            },
            // Redraw data table after edit
            redraw: () => {
                this.foundation_.adapter_.setColumns(this.columns);
                this.foundation_.adapter_.setData(this.data);
            }
        });
    }
}

mdc.autoInit.register(`MDCDataTable`, MDCDataTable);

const {
    MDCFoundation
} = mdc.base;

class MDCDataTableFoundation extends MDCFoundation {

    static get defaultAdapter() {
        return {
            registerSortClickHandler: ( /* handler: EventListener */ ) => {},
            deregisterSortClickHandler: ( /* handler: EventListener */ ) => {},
            readColumns: () => {},
            setColumns: () => {},
            readData: () => {},
            setData: () => {},
            redraw: () => {}
        };
    }

    constructor(adapter) {
        super(Object.assign(MDCDataTableFoundation.defaultAdapter, adapter));
        // Attributes
        this.columns = [];
        this.data = [];
        // Methods
        // On sort
        this.sortClickHandler_ = (e) => {
            let target = e.target.closest(DATATABLE_SORTABLE_SELECTOR);
            if (target) {
                let index = Array.prototype.indexOf.call(target.parentElement.children, target);
                this.columns.forEach((col, i) => {
                    if (i !== index) {
                        col.sort = 0;
                    } else {
                        if (col.sort === `asc` || col.sort === 1) {
                            col.sort = `desc`;
                        } else {
                            col.sort = `asc`;
                        }
                    }
                });
                this.adapter_.redraw();
            }
        };
    }

    init() {
        // Read columns
        this.columns = this.adapter_.readColumns();
        // Read data
        this.data = this.adapter_.readData();
        // Click
        this.adapter_.registerSortClickHandler(this.sortClickHandler_);
    }

    destroy() {
        // Click
        this.adapter_.deregisterSortClickHandler(this.sortClickHandler_);
    }

    setColumns(cols) {
        this.adapter_.setColumns(cols);
    }

    setData(data) {
        this.adapter_.setData(data);
    }

}

var getStyle = function (e, styleName) {
    var styleValue = "";
    if(document.defaultView && document.defaultView.getComputedStyle) {
        styleValue = document.defaultView.getComputedStyle(e, "").getPropertyValue(styleName);
    }
    else if(e.currentStyle) {
        styleName = styleName.replace(/\-(\w)/g, function (strMatch, p1) {
            return p1.toUpperCase();
        });
        styleValue = e.currentStyle[styleName];
    }
    return styleValue;
}

var setStyle = function (e, styleName, styleValue) {
    if(document.defaultView && document.defaultView.getComputedStyle) {
        e.style.setProperty(styleName, styleValue);
    }
    else if(e.currentStyle) {
        styleName = styleName.replace(/\-(\w)/g, function (strMatch, p1) {
            return p1.toUpperCase();
        });
        e.style.styleName = styleValue;
    }
}


// var tables = document.querySelectorAll('.mdc-data-table')
// Array.prototype.forEach.call(tables, (table) => new MDCDataTable(table));
// 
// Redimensionar tablas con scroll (Sean ajustables a sus contenedores)
window.onload = function() {
    var tables_overflow = document.querySelectorAll('.mdc-table-overflow');
    Array.prototype.forEach.call(tables_overflow, function(table) {
        setStyle(table, "display", "none");
        //table.style.display = "none";
        var container = table.parentNode;
        var width = getStyle(container, "width");
        //table.style.display = "block";
        setStyle(table, "display", "block");
        setStyle(table, "width", width);
    });
};

// Redimensionar tablas con scroll cuando se redimensiona la ventana
window.onresize = function() {
    var tables_overflow = document.querySelectorAll('.mdc-table-overflow');
    Array.prototype.forEach.call(tables_overflow, function(table) {
        setStyle(table, "display", "none");
        //table.style.display = "none";
        var container = table.parentNode;
        var width = getStyle(container, "width");
        //table.style.display = "block";
        setStyle(table, "display", "block");
        setStyle(table, "width", width);
    });
};