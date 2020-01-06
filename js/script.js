// window.d3 = require('d3');
// const functionPlot = require('function-plot');

if (!String.prototype.delSpaces) {
	(function() {
		var spaces = / /g;
		String.prototype.delSpaces = function() {
			return this.replace(spaces, '');
		};
	})();
}

if (!String.prototype.format) {
	String.prototype.format = function () {
		var a = this;
		for (var k in arguments) {
			a = a.replace(new RegExp("\\{" + k + "\\}", 'g'), arguments[k]);
		}
		return a;
	}
}


function computeYScale(width, height, xScale) {
	var xDiff = xScale[1] - xScale[0];
	var yDiff = height * xDiff / width;
	return [-yDiff / 2, yDiff / 2];
}

function computeWitdhScale(width) {
	if (width > maxWidth) {
		return maxWidth;
	}
	else {
		return width;
	}
}

var maxWidth = 580;
var height = 400;

// valores Iniciales de X
var xScale = [-6, 6];

var options = {
	target: '#function',
	width: maxWidth,
	height: height,
	xAxis: {
		label: 'X',
		domain: xScale
	},
	yAxis: {
		label: 'Y',
		domain: computeYScale(maxWidth, height, xScale)
	},
	grid: true
};

var conditionals = [
	{ value: 'leq', text: '&le;'},
	{ value: 'geq', text: '&ge;'},
	{ value: 'eq', text: '&#61;'},
];

const Solutions = {
	OPTIMAL: 0,
	INFINITE: 1,
	UNLIMITED: 2,
	NOT_MORE: 3,
	DEGENERATE: 4
}

var TEX_VAR = "\\(X_{{0}}\\)";
var TEX_SLACK = "\\(S_{{0}}\\)";
var TEX_Z = "\\(Z\\)";
var TEX_BI = "\\(B_i\\)";
var TEX_SOL = "{0} = {1}";

// Matriz donde estan las restricciones y la función objetivo
// Las convierte en la forma estándar
// Usa funciones de math.js
class MatrizRFO {
	constructor(array_res, array_fo, z_init=0) {
		if ((typeof array_res === "object" && array_res.length > 0) || 
			(typeof array_fo === "object" && array_fo.length > 0) ){
			this.matriz = array_res;
			this.fo = array_fo;
			if (typeof z_init === 'number') {
				this.z_init = z_init;
			}
			else {
				throw new TypeError("The argument z_init is not a number");
			}
		}
		else {
			throw new TypeError("The arguments [array_res, array_fo] is not an array");
		}
	}

	toStandardForm() {
		var standard, objfunFinal;
		var conditions = math.transpose(math.column(this.matriz, this.matriz[0].length - 2))[0];
		var i_eq = 0;

		conditions.forEach((element) => {
			if (element === "eq") {
				i_eq++;
			}
		});

		objfunFinal = [...this.fo];

		if (i_eq == conditions.length) {
			// No hay que estandarizar
			// Solo hay que devolver el array sin los condicionales;
			standard = new Array();
			this.matriz.forEach((array) => standard.push(array.filter((item) => typeof item === 'number')));

			// Agregamos el valor inicial al array
			objfunFinal.push(this.z_init);
		}
		else {
			// Si hay que estandarizar
			// Se crea la matriz identidad con las variables slack
			var slacks = conditions.map((item) => (item === "geq") ? -1 : 1);
			var identity = math.diag(slacks);
			// Se extrae las bi de las restricciones
			var bi = math.column(this.matriz, this.matriz[0].length - 1);

			// Se extrae los valores de las variables de decisión
			var values = new Array();
			this.matriz.forEach((array) => values.push(array.filter((item, index) => index < array.length - 2)));

			// Se concatena la matriz de las variables, la matriz identidad y 
			// las bi de las restricciones
			standard = math.concat(math.concat(values, identity), bi);

			// Agregamos ceros y el valor inicial
			conditions.forEach(() => objfunFinal.push(0));
			objfunFinal.push(this.z_init);
		}
		var json = {restrictions: standard, objfunction: objfunFinal};
		return json;
	}

	isStandardOrigin() {
		var conditions = math.transpose(math.column(this.matriz, this.matriz[0].length - 2))[0];
		var i_eq = 0;

		conditions.forEach((element) => {
			if (element === "eq") {
				i_eq++;
			}
		});

		if (i_eq == conditions.length) {
			// Las restricciones estan en forma estandarizar
			return true;
		}
		else {
			// Las restricciones no estan en forma estandarizar
			return false;
		}
	}

	// calculateMaxs() {
	// 	var matrizA = [];
	// 	var arrayMaxs = [];
	// 	this.matriz.forEach(function(element) {
	// 		var arr = [];
	// 		element.forEach(function(item, index) {
	// 			if (index < element.length - 1) {
	// 				arr.push(item);
	// 			}
	// 		});
	// 		matrizA.push(arr);
	// 	});
	// 	matrizA = math.max(math.abs(matrizA), 1);
	// 	this.matriz.forEach(function(element, i) {
	// 		var arr = [];
	// 		element.forEach(function(item, j) {
	// 			if (j < element.length - 1) {
	// 				if (item == matrizA[i]) {
	// 					arr.push(item);
	// 					arr.push(j);
	// 				}
	// 			}
	// 		});
	// 		arrayMaxs.push(arr);
	// 	});
	// 	this.maxsA = arrayMaxs;
	// 	return this.maxsA;
	// }

	// sort(compareFunction) {
	// 	if (arguments.length === 0) {
	// 		this.calculateMaxs();
	// 		this.matriz.sort((rowi, rowj) => this.compareDiagNum(rowi, rowj));
	// 	}
	// 	else {
	// 		if (typeof compareFunction === "function") {
	// 			this.matriz.sort(compareFunction);
	// 		}
	// 		else {
	// 			throw new TypeError("El parametro compareFunction no es una función");
	// 		}
	// 	}
	// }

	// compareDiagNum(rowi, rowj) {
	// 	var i = this.matriz.indexOf(rowi);
	// 	var j = this.matriz.indexOf(rowj);
	// 	if (this.maxsA[i][0] < this.maxsA[j][0]) {
	// 		if (this.maxsA[i][1] > this.maxsA[j][1]) {
	// 			return 1;
	// 		}
	// 		else if (this.maxsA[i][1] == this.maxsA[j][1]) {
	// 			return this.compareNumbers(rowi[this.maxsA[i][1]], rowj[this.maxsA[i][1]]);
	// 		}
	// 		return -1;
	// 	}
	// 	if (this.maxsA[i][0] > this.maxsA[j][0]) {
	// 		if (this.maxsA[i][1] > this.maxsA[j][1]) {
	// 			return 1;
	// 		}
	// 		else if (this.maxsA[i][1] == this.maxsA[j][1]) {
	// 			return this.compareNumbers(rowi[this.maxsA[i][1]], rowj[this.maxsA[i][1]]);
	// 		}
	// 		return 1;
	// 	}
	// 	if (this.maxsA[i][0] == this.maxsA[j][0]) {
	// 		if (this.maxsA[i][1] > this.maxsA[j][1]) {
	// 			return 1;
	// 		}
	// 		else if (this.maxsA[i][1] == this.maxsA[j][1]) {
	// 			return this.compareNumbers(rowi[this.maxsA[i][1]], rowj[this.maxsA[i][1]]);
	// 		}
	// 		return 0;
	// 	}
	// }

	// compareNumbers(a, b) {
	// 	if (a < b) {
	// 		return -1;
	// 	}
	// 	if (a > b) {
	// 		return 1;
	// 	}
	// 	return 0;
	// }

	// hasDiagDominant() {
	// 	var dominante = true;
	// 	for (var i = 0; i < this.matriz.length; i++) {
	// 		var sum = 0;
	// 		var diag;
	// 		for (var j = 0; j < this.matriz[i].length - 1; j++) {
	// 			if (i == j) {
	// 				diag = math.abs(this.matriz[i][j]);
	// 			}
	// 			else {
	// 				sum += math.abs(this.matriz[i][j]);
	// 			}
	// 		}
	// 		if (diag <= sum) {
	// 			dominante = false;
	// 			break;
	// 		}
	// 	}
	// 	return dominante;
	// }

	getMatriz() {
		return this.matriz;
	}

	toFractionValues() {

	}

	toString() {
		return JSON.stringify(this.matriz);
	}
}

// Tabla Simplex con diseño MDC
class TableSimplexMDCModel {
	constructor(head_vd, fst_vb, r_values, fo_values, aria_label="") {
		if ((typeof head_vd === "object" && head_vd.length > 0) || 
			(typeof fst_vb === "object" && fst_vb.length > 0) ||
			(typeof r_values === "object" && r_values.length > 0) ||
			(typeof fo_values === "object" && fo_values.length > 0)) {
			this.head_vd = head_vd;
			this.fst_vb = fst_vb;
			this.r_values = r_values;
			this.fo_values = fo_values;
			this.aria_label = aria_label;
		}
		else {
			throw new TypeError("The arguments is not an array");
		}
	}

	toJqueryDOM() {
		var div_container = $('<div>', {'class': "mdc-data-table"});
		var table = $('<table>', {
			'class': 'mdc-data-table__table',
			'aria-label': this.aria_label
		});
		var thead = $('<thead>');
		var tbody = $('<tbody>', {'class': 'mdc-data-table__content'});
		var tfoot = $('<tfoot>');
		var tr_head = $('<tr>', {'class': 'mdc-data-table__header-row'});
		var tr_foot = $('<tr>', {'class': 'mdc-data-table__row'});

		var thead_values = [...this.head_vd];
		thead_values.unshift('');
		thead_values.push(TEX_BI);
		thead_values.forEach( function(element, index) {
			var th = $('<th>', {
				'class': 'mdc-data-table__header-cell',
				'role': 'columnheader',
				'scope': 'col',
				'text': element
			});
			tr_head.append(th);
		});
		thead.append(tr_head);
		table.append(thead);

		var tbody_values = new Array();
		this.r_values.forEach( function(element, index) {
			var row = [...element];
			row.unshift(this.fst_vb[index]);
			tbody_values.push(row);
		}, this);
		tbody_values.forEach( function(array, i) {
			var tr = $('<tr>', {'class': 'mdc-data-table__row'});
			array.forEach( function(element, j) {
				var td = $('<td>', {
					'class': 'mdc-data-table__cell',
					'text': element
				});
				tr.append(td);
			});
			tbody.append(tr);
		});
		table.append(tbody);

		var tfoot_values = [...this.fo_values];
		tfoot_values.unshift(TEX_Z);
		tfoot_values.forEach( function(element, index) {
			var td = $('<td>', {
				'class': 'mdc-data-table__cell',
				'role': 'columnfooter',
				'scope': 'col',
				'text': element
			});
			tr_foot.append(td);
		});
		tfoot.append(tr_foot);
		table.append(tfoot);

		div_container.append(table);

		return div_container;
	}

}

// Ecuacion lineal de tres dimensiones
class LinealEquation {
	constructor(objA, nB) {
		if (typeof objA === "string") {
			this.eq = objA.toLowerCase();
			this.objExp = this.calculateObjExp();
		}
		else if (typeof objA === "object" && !objA.length) {
			if (typeof nB !== "undefined") {
				if (typeof nB === "number") {
					this.objExp = this.calculateObjExp(objA, nB);
					this.eq = this.getEquation();
				}
				else {
					throw new TypeError("El parámetro nB no es número");
				}
			}
			else {
				throw new TypeError("El parámetro nB no está definido");
			}
		}
		else if (typeof objA === "undefined") {
			throw new TypeError("El parámetro objA no está definido");
		}
		else {
			throw new TypeError("El parámetro objA tiene un tipo de dato invalido");
		}
	}

	setEquation(eq) {
		if (typeof eq !== "undefined" && typeof eq === "string") {
			this.eq = eq.toLowerCase();
		}
	}

	getEquation() {
		if (typeof this.eq !== "undefined") {
			return this.eq;
		}
		else {
			var str_eq = "";
			str_eq += this.objExp.vars.strs.x + "x";
			if (this.objExp.vars.numbers.y < 0){
				str_eq += this.objExp.vars.strs.y + "y";
			}
			else {
				str_eq += "+" + this.objExp.vars.strs.y + "y";
			}
			if (this.objExp.vars.numbers.z < 0){
				str_eq += this.objExp.vars.strs.z + "z";
			}
			else {
				str_eq += "+" + this.objExp.vars.strs.z + "z";
			}
			str_eq += "=" + this.objExp.result.str;
			return str_eq;
		}
	}

	calculateObjExp(objA, nB) {
		if (typeof objA !== "undefined" && typeof nB !== "undefined") {
			if (typeof objA === "object" && typeof nB === "number") {
				var objExp = {};
				objExp.vars = {numbers: {}, strs: {}};
				objExp.vars.numbers = objA;
				objExp.result = {};
				objExp.result.number = nB;
				if (typeof objExp.vars.numbers.x === "undefined") {
					objExp.vars.numbers.x = 0;
				}
				objExp.vars.strs.x = objExp.vars.numbers.x.toString();
				if (typeof objExp.vars.numbers.y === "undefined") {
					objExp.vars.numbers.y = 0;
				}
				objExp.vars.strs.y = objExp.vars.numbers.y.toString();
				if (typeof objExp.vars.numbers.z === "undefined") {
					objExp.vars.numbers.z = 0;
				}
				objExp.vars.strs.z = objExp.vars.numbers.z.toString();
				objExp.result.str = nB.toString();
				return objExp;
			}
			else {
				throw TypeError("Los parametros tienen un tipo de dato invalido");
			}
		}
		else if (typeof this.eq !== "undefined" && typeof this.eq === "string") {
			var objExp = {};
			var equation = this.eq.delSpaces();
			var arrayCad = equation.split("=");
			var partsVars = arrayCad[0].split(/(?=\u002B|\u002D)/);
			var arrExp = [];
			if (partsVars.length <= 3) {
				objExp.vars = {numbers: {}, strs: {}};
				objExp.result = {};
				partsVars.forEach(function(element, index) {
					if (element.includes('x')) {
						var sNum = (element.replace('x', '') !== "") ? element.replace('x', '') : "1";
						var sNum = (sNum.match(/^(\u002B|\u002D)$/)) ? sNum.concat("1") : sNum;
						objExp.vars.numbers.x = math.evaluate(sNum);
						objExp.vars.strs.x = sNum;
					}
					else if (element.includes('y')) {
						var sNum = (element.replace('y', '') !== "") ? element.replace('y', '') : "1";
						var sNum = (sNum.match(/^(\u002B|\u002D)$/)) ? sNum.concat("1") : sNum;
						objExp.vars.numbers.y = math.evaluate(sNum);
						objExp.vars.strs.y = sNum;
					}
					else if (element.includes('z')) {
						var sNum = (element.replace('z', '') !== "") ? element.replace('z', '') : "1";
						var sNum = (sNum.match(/^(\u002B|\u002D)$/)) ? sNum.concat("1") : sNum;
						objExp.vars.numbers.z = math.evaluate(sNum);
						objExp.vars.strs.z = sNum;
					}
				});
				if (typeof objExp.vars.numbers.x === "undefined") {
					objExp.vars.numbers.x = 0;
					objExp.vars.strs.x = objExp.vars.numbers.x.toString();
				}
				if (typeof objExp.vars.numbers.y === "undefined") {
					objExp.vars.numbers.y = 0;
					objExp.vars.strs.y = objExp.vars.numbers.y.toString();
				}
				if (typeof objExp.vars.numbers.z === "undefined") {
					objExp.vars.numbers.z = 0;
					objExp.vars.strs.z = objExp.vars.numbers.z.toString();
				}
				objExp.result.number = math.evaluate(arrayCad[1]);
				objExp.result.str = arrayCad[1];
				return objExp;
			}
			else {
				throw RangeError("Solo se permite hasta tres dimensiones");
			}
		}
		else {
			throw TypeError("Los parametros están indefinidos");
		}
	}

	simplifyExp(variable) {
		if (typeof variable !== "undefined" && typeof variable === "string") {
			var str_exp = "";
			if (variable === "x"){
				str_exp += "x=(";
				str_exp += this.objExp.result.str;
				var temp = this.objExp.vars.strs.y.replace(/\u002B|\u002D/, "");
				if (this.objExp.vars.numbers.y * -1 < 0) {
					str_exp += "-" + temp + "y";
				}
				else {
					str_exp += "+" + temp + "y";
				}
				temp = this.objExp.vars.strs.z.replace(/\u002B|\u002D/, "");
				if (this.objExp.vars.numbers.z * -1 < 0) {
					str_exp += "-" + temp + "z";
				}
				else {
					str_exp += "+" + temp + "z";
				}
				temp = this.objExp.vars.strs.x.replace("+", "");
				str_exp += ")/(" + temp + ")";
			}
			else if (variable === "y") {
				str_exp += "y=(";
				str_exp += this.objExp.result.str;
				var temp = this.objExp.vars.strs.x.replace(/\u002B|\u002D/, "");
				if (this.objExp.vars.numbers.x * -1 < 0) {
					str_exp += "-" + temp + "x";
				}
				else {
					str_exp += "+" + temp + "x";
				}
				temp = this.objExp.vars.strs.z.replace(/\u002B|\u002D/, "");
				if (this.objExp.vars.numbers.z * -1 < 0) {
					str_exp += "-" + temp + "z";
				}
				else {
					str_exp += "+" + temp + "z";
				}
				temp = this.objExp.vars.strs.y.replace("+", "");
				str_exp += ")/(" + temp + ")";
			}
			else if (variable === "z") {
				str_exp += "z=(";
				str_exp += this.objExp.result.str;
				var temp = this.objExp.vars.strs.x.replace(/\u002B|\u002D/, "");
				if (this.objExp.vars.numbers.x * -1 < 0) {
					str_exp += "-" + temp + "x";
				}
				else {
					str_exp += "+" + temp + "x";
				}
				temp = this.objExp.vars.strs.y.replace(/\u002B|\u002D/, "");
				if (this.objExp.vars.numbers.y * -1 < 0) {
					str_exp += "-" + temp + "y";
				}
				else {
					str_exp += "+" + temp + "y";
				}
				temp = this.objExp.vars.strs.z.replace("+", "");
				str_exp += ")/(" + temp + ")";
			}
			else {
				throw new EvalError("No se puede despejar la variable de la ecuación. Se aceptan solo variables x, y o z");
			}
			var expresion = new ExpresionFn(str_exp);
			return expresion;
		}
		else {
			throw new TypeError("El parametro variable no está definido o no es válido");
		}
	}

	transArray() {
		if (typeof this.objExp !== "undefined") {
			this.objExp = this.calculateObjExp();
		}
		var numbers = [];
		numbers.push(this.objExp.vars.numbers.x);
		numbers.push(this.objExp.vars.numbers.y);
		numbers.push(this.objExp.vars.numbers.z);
		numbers.push(this.objExp.result.number);

		// var numbers = [];
		// node.traverse(function (node, path, parent) {
		// 	if (node.isConstantNode) {
		// 		numbers.push(node.value);
		// 	}
		// });
		return numbers;
	}

	toString() {
		return this.eq;
	}
}

// Expresion de la forma x = r
class ExpresionFn {
	constructor(exp) {
		if (typeof exp !== "undefined") {
			if (typeof exp === "string") {
				this.nodeExp = math.parse(exp);
			}
			else {
				throw new TypeError("El parámetro exp no es un string");
			}
		} 
		else {
			throw new TypeError("El parámetro exp no esta definido");
		}
	}

	evaluate(scope) {	
		return this.nodeExp.compile().evaluate(scope);
	}

	toTex() {
		return this.nodeExp.toTex();
	}

	toString() {
		return this.nodeExp.toString();
	}
}

class FuncionMath {
	constructor(fn) {
		this.fn = fn;
		this.datum = {
			fn: fn
		};
	}

	evaluate(valueX) {
		//return Parser.evaluate(this.fn, { x: valueX });
		var scope = {
			x: valueX
		};
		return functionPlot.eval.builtIn(this.datum, 'fn', scope);
	}
}

$(document).ready(function() {

	efectsMDC();
	//$('.my-card-hidden').hide();

	$("input[name=initial_z]").prop('disabled', true);
	// $("input[name=p2]").prop('disabled', true);

	// $("#function").hide();
	// var width_cont = $("#function").parent().width();
	// console.log(width_cont);
	// options.width = computeWitdhScale(width_cont);
	// options.yAxis.domain = computeYScale(options.width, height, xScale);
	// functionPlot(options);
	// $("#function").show();

	// $("#form-graph").submit(function(event) {
	// 	event.preventDefault();
	// 	graphic_fx();
	// });

	// $("button#graph").click(function(event) {
	// 	$("#form-graph").submit();
	// });

	$("input#v_initial").click(function(event) {
		if($(this).is(':checked')) {
			$("input[name=initial_z]").prop('disabled', false);
		}
		else {
			$("input[name=initial_z]").prop('disabled', true);
		}
	});

	$("#form-data-solution").submit(function(event) {
		event.preventDefault();
		var list = $("#table-rest").find('tbody').children();
		var list_values_rt = [].map.call(list, (node) => [].map.call(node.children, (td) => {
			if ($(td).find('select').length > 0) {
				return $(td).children('select').val();
			} else {
				return evaluate($(td).text());
			}
		}));
		//console.log(list_values_rt);

		list = $("#table-funcion_z").find('tbody').find('td');
		var list_values_fo = [].map.call(list, (node) => evaluate($(node).text()));
		//console.log(list_values_fo);
		
		var tip = $("input[name=radios]:checked").val();

		if (tip === "max") {
			list_values_fo = math.multiply(list_values_fo, -1);
		}
		
		var z_init;
		if($("input#v_initial").is(':checked')) {
			var txt_init = $("input[name=initial_z]").val();
			if (isNumber(evaluate(txt_init))) {
				z_init = evaluate(txt_init);
			}
			else {
				console.error("The initial value Zo is not a number");
			}
		}
		else {
			z_init = 0;
		}
		
		calculate_solution(list_values_rt, list_values_fo, z_init);
	});

	$("button#calculate").click(function(event) {
		$("#form-data-solution").submit();
	});

	$("button#add-row-table").click(function(event) {
		var last_row = $("#table-rest tbody tr").length - 1;
		addRow("#table-rest", last_row, 1);
	});

	$("button#rm-row-table").click(function(event) {
		var last_row = $("#table-rest tbody tr").length - 1;
		rmRow("#table-rest", last_row);
	});

	$("button#add-column-table").click(function(event) {
		var last_col_var = $("#table-rest tr:last td").length - 3;
		addColumn("#table-rest", last_col_var, 1, last_col_var + 1);

		// Agrega columna a la función objetivo
		var last_col_z = $("#table-funcion_z tr:last td").length - 1;
		addColumn("#table-funcion_z", last_col_z, 1, last_col_z + 1);
	});

	$("button#rm-column-table").click(function(event) {
		var last_col_var = $("#table-rest tr:last td").length - 3;
		rmColumn("#table-rest", last_col_var);

		// Elimina columna de la función objetivo
		var last_col_z = $("#table-funcion_z tr:last td").length - 1;
		rmColumn("#table-funcion_z", last_col_z, 1);
	});

	$("button#clear-data").click(function(event) {
		$("input#initial_z").val("");
		var trs = document.querySelectorAll('#table-rest tbody tr td');
		Array.prototype.forEach.call(trs, (item) => $(item).empty());
		$("input[name=z_result]").val("");
		$("table#table-solution tbody tr").remove();

		// if (options.data && options.data.length > 0) {
		// 	if (options.data[0].fn) {
		// 		options.data[0].fn = '';
		// 	}
		// 	options.xAxis.domain = xScale;
		// 	options.yAxis.domain = computeYScale(options.width, height, xScale);
		// 	if (options.disableZoom) {
		// 		delete options.disableZoom;
		// 	}
		// 	functionPlot(options);
		// }
	});

	$("button#show-table").click(function(event) {
		if ($(this).hasClass('show')) {
			$('.my-card-hidden').show();
			$(this).removeClass('show');
			$(this).addClass('hide');
			$(this).find(".mdc-button__label").text("Ocultar Tabla");
		}
		else if ($(this).hasClass('hide')) {
			$('.my-card-hidden').hide();
			$(this).removeClass('hide');
			$(this).addClass('show');
			$(this).find(".mdc-button__label").text("Mostrar Tabla");
		}
	});
});

$(window).on('load', function() {
	$('.my-card-hidden').hide();

	$("#function").hide();
	var width_cont = $("#function").parent().width();
	options.width = computeWitdhScale(width_cont);
	options.yAxis.domain = computeYScale(options.width, height, xScale);
	// functionPlot(options);
	$("#function").show();
});

$(window).resize(function(){
	//aqui el codigo que se ejecutara cuando se redimencione la ventana
	$("#function").hide();
	var width_cont = $("#function").parent().width();
	options.width = computeWitdhScale(width_cont);
	options.yAxis.domain = computeYScale(options.width, height, xScale);
	// functionPlot(options);
	$("#function").show();

	// cambiar la grilla de los inputs, cambiando sus clases
	//resize_grid_inputs();
});

// function graphic_fx(){
// 	var fx = $("input#funcion_x").val();

// 	if (fx !== "") {
// 		options.data = [{
// 			fn: fx,
// 			sampler: 'builtIn',
// 			graphType: 'polyline'
// 		}];

// 		if ($("input#interval").is(':checked')) {
// 			var x1 = parseFloat($("input[name=p1]").val());
// 			var x2 = parseFloat($("input[name=p2]").val());
// 			var width = options.width;
// 			options.xAxis.domain = [x1, x2];
// 			options.yAxis.domain = computeYScale(width, height, [x1, x2]);
// 			options.disableZoom = true;

// 			// var datum = {
// 			// 	fn: fx
// 			// };
// 			// var scope = {
// 			// 	x: x1
// 			// };

// 			// var y1 = functionPlot.eval.builtIn(datum, 'fn', scope);
// 			// console.log("P(" + x1 + ", " + y1 + ")");

// 			// // var scope2 = {
// 			// // 	x: x2
// 			// // };
// 			// // 
// 			// // var y1 = functionPlot.eval.builtIn(datum, 'fn', scope);
// 			// // //var y2 = functionPlot.eval.builtIn(datum, 'fn', scope2);
// 			// // console.log("P(" + x1 + ", " + y1 + ")");
// 			// // //console.log("P(" + x2 + ", " + y2 + ")");
// 			// var y2 = y1 * -1;

// 			// if (y1 > 0) {
// 			// 	var aux = y2;
// 			// 	y2 = y1;
// 			// 	y1 = aux;
// 			// }
// 			// options.yAxis.domain = [y1, y2];
// 			// 
// 			// var exp = new FuncionMath(fx);
// 			// console.log(exp.evaluate(x1));
// 		}
// 		else {
// 			var width = options.width;
// 			options.xAxis.domain = [-6, 6];
// 			options.yAxis.domain = computeYScale(width, height, [-6, 6]);
// 			if (options.disableZoom) {
// 				delete options.disableZoom;
// 			}
// 		}
// 		functionPlot(options);
// 	}
// }

// Calculate solution for the simplex methodo (vbeta)
function calculate_solution(ar_rest, ar_fobj, z_init=0) {
	console.log(ar_rest);
	console.log(ar_fobj);

	if (Array.isArray(ar_rest) && ar_rest.length > 0 && Array.isArray(ar_fobj) && ar_fobj.length > 0) 
	{
		if (ar_rest.some((element) => element.some((item) => typeof item === "number" && isNaN(item)))) {
			alert("Las restricciones tienen valores inválidos");
			return;
		}
		if (ar_fobj.some((element) => isNaN(element))) {
			alert("La función objetivo tiene valores inválidos");
			return;
		}

		var objMFO = new MatrizRFO(ar_rest, ar_fobj, z_init);
		var standard = objMFO.toStandardForm();

		console.log(standard.restrictions);
		console.log(standard.objfunction);

		var a_Sol, js_Sol, z_Sol, tablemdc;
		var head_vd, ar_str_vb;
		var more_simplex = true;

		var n = standard.objfunction.length - 1;
		var m = standard.restrictions.length;
		var n_vb = n - (n - m);

		if (objMFO.isStandardOrigin()) {
			// Las ecuaciones ya están estandarizadas o no se necesitan estandarizar
			// Puede ser que estén o no estén en forma canónica
			var arr_z = ar_fobj;
			var condition = true;

			head_vd = [].map.call(arr_z, (it, id) => TEX_VAR.format(id+1));
			ar_str_vb = head_vd.filter((it, id) => id < n_vb);

			tablemdc = new TableSimplexMDCModel(head_vd, ar_str_vb, standard.restrictions, standard.objfunction);
			$("#box-data-table #tables-solutions").append(tablemdc.toJqueryDOM());

			do{
				// Verifica si no tiene numeros negativos / tiene solo positivos y ceros 
				// la función objetivo
				var onlyPos = math.filter(arr_z, (x) => x >= 0);
				if (onlyPos.length == arr_z.length) {
					// Filtramos los ceros en la funcion objetivo (sin contar el valor inicial)
					// deben ser iguales al numero de variables basicas 
					var zeros = math.filter(arr_z, (x) => x == 0);
					if (zeros.length == n_vb) {
						// No hay más solución
						a_Sol = Solutions.NOT_MORE;
						z_Sol = z_init;
						condition = false;
						more_simplex = false;
					}
					else if (zeros.length <= n - m) {
						// El problema tiene infinitas soluciones
						a_Sol = Solutions.INFINITE;
						condition = false;
						more_simplex = false;
					}
					else {
						var ord = [...arr_z].sort((a, b) => a - b);
						
						// Escogemos la columna pivote, el numero más menor
						var n_piv = arr_z.indexOf(ord[0]);
						// Obtenemos la columna pivote
						var col_piv = math.transpose(math.column(standard.restrictions, n_piv))[0];

						// Sacamos todos los numeros negativos
						var neg = math.filter(col_piv, (x) => x < 0);

						if (neg.length == col_piv.length) {
							// Tiene solución ilimitada
							a_Sol = Solutions.UNLIMITED;
							condition = false;
							more_simplex = false;
						}
						else {
							standard = updateTableSimplex(head_vd, ar_str_vb, standard.restrictions, standard.objfunction, n_piv);
							arr_z = math.filter(standard.objfunction, (i, index) => index < standard.objfunction.length - 1);
						}
					}
				}
				else {
					condition = false;
				}

			} while (condition);
		}
		else {
			var vars_r = standard.objfunction.slice(0, standard.objfunction.length - 1);
			head_vd = [].map.call(vars_r, (it, id) => {
				if (id < vars_r.length - m) {
					return TEX_VAR.format(id+1);
				}
				else {
					return TEX_SLACK.format(id-m+1);
				}
			});
			ar_str_vb = head_vd.slice(-m);
		}

		if (more_simplex) {

			tablemdc = new TableSimplexMDCModel(head_vd, ar_str_vb, standard.restrictions, standard.objfunction);
			$("#box-data-table #tables-solutions").append(tablemdc.toJqueryDOM());

			var only_var_z = math.filter(standard.objfunction, (i, index) => index < standard.objfunction.length - 1);

			var sort_z = [...only_var_z].sort((a, b) => a - b);

			if (sort_z[0] >= 0) {
				// No hay solución
				a_Sol = Solutions.NOT_MORE;
				z_Sol = z_init;
			}
			else {
				var condition = true;
				while (sort_z[0] < 0 && condition) {
					// Escogemos la columna pivote, el numero más menor
					var n_piv = only_var_z.indexOf(sort_z[0]);
					// Obtenemos la columna pivote
					var col_piv = math.transpose(math.column(standard.restrictions, n_piv))[0];

					// Sacamos todos los numeros negativos
					var n_neg = math.filter(col_piv, (x) => x < 0);

					if (n_neg.length == col_piv.length) {
						// Tiene solución ilimitada
						a_Sol = Solutions.UNLIMITED;
						condition = false;
					}
					else {
						standard = updateTableSimplex(head_vd, ar_str_vb, standard.restrictions, standard.objfunction, n_piv);
						only_var_z = math.filter(standard.objfunction, (i, index) => index < standard.objfunction.length - 1);
						sort_z = [...only_var_z].sort((a, b) => a - b);
					}
				}

				// Filtramos los ceros en la funcion objetivo (sin contar el valor inicial)
				var zeros = math.filter(only_var_z, (x) => x == 0);
				if (zeros.length == n_vb) {
					// Si son iguales al numero de variables basicas 
					// No hay más solución. Es la solución óptima
					a_Sol = Solutions.OPTIMAL;
					// z_Sol = standard.objfunction[n-1];
				}
				else if (zeros.length <= n - m) {
					// Si alguna variable de decisión no básica tiene un valor 0
					// El problema tiene infinitas soluciones
					a_Sol = Solutions.INFINITE;
					// z_Sol = standard.objfunction[n-1];
				}
				else if (zeros.length == n - 1) {
					// El problema tiene solución degenerada
					a_Sol = Solutions.DEGENERATE;
					// z_Sol = standard.objfunction[n-1];
				}
				z_Sol = standard.objfunction[n-1];
			}
		}

		// if (typeof standard.result !== "undefined" && $.isEmptyObject(standard.result)) {
		// 	js_Sol = standard.result;
		// }

		js_Sol = standard.result;
		
		var str_a_sol;
		switch (a_Sol) {
			case Solutions.OPTIMAL:
				str_a_sol = "Solución Óptima";
				break;
			case Solutions.INFINITE:
				str_a_sol = "Infinitas Soluciones";
				break;
			case Solutions.UNLIMITED:
				str_a_sol = "Solución Ilimitada";
				break;
			case Solutions.NOT_MORE:
				str_a_sol = "No hay más Soluciones";
				break;
			case Solutions.DEGENERATE:
				str_a_sol = "Solución Degenerada";
				break;
		}

		var str_solutions = new Array();

		if (!$.isEmptyObject(js_Sol)) {
			for (var clave in js_Sol){
				// Controlando que json realmente tenga esa propiedad
				if (js_Sol.hasOwnProperty(clave)) {
					str_solutions.push(TEX_SOL.format(clave, js_Sol[clave]));
				}
			}
			var txtInputResult = "\\(" + str_solutions.join(',') + "\\)<p>" + str_a_sol + "</p>";
		}
		else {
			var txtInputResult = str_a_sol;
		}

		// var txtInputResult = str_solutions.join(',') + "\\\\" + str_a_sol;
		$("#z_result").html(txtInputResult);
		MathJax.Hub.Queue(["Typeset", MathJax.Hub, "#z_result"]);
	}
	else {
		alert("Ingrese primero los campos");
	}
}

function updateTableSimplex(head_vd, fst_vb, r_values, fo_values, i_piv_col) {
	var json;
	var head_vd, fst_vb;
	var i_piv_row, row_piv, piv_el;
	var regex = new RegExp('\u005C\u005C\u0028|\u005C\u005C\u0029', 'gu'); // /\u0028|\u0029/gu
	var n = fo_values.length;

	// Obtenemos la columna pivote
	var col_piv = math.transpose(math.column(r_values, i_piv_col))[0];
	var col_bi = math.transpose(math.column(r_values, n-1))[0];
	var razon =  new Array();

	col_piv.forEach((element, i) => {
		// if (element > 0) {
		// 	razon.push(col_bi[i] / element);
		// }
		// else {
		// 	razon.push(0);
		// }
		razon.push(col_bi[i] / element);
	});

	var razon_s_neg = razon.filter((element) => element > 0);

	console.log(razon);
	console.log(razon_s_neg);

	var ord_razon = [...razon_s_neg].sort((a, b) => a - b);
	i_piv_row = razon.indexOf(ord_razon[0]);
	piv_el = col_piv[i_piv_row];

	row_piv = r_values[i_piv_row];
	// Cambiar variable elegida de columna a la fila (se hace variable básica)
	fst_vb[i_piv_row] = head_vd[i_piv_col];

	r_values.forEach( function(element, index) {
		if (i_piv_row == index) {
			r_values[index] = math.divide(element, piv_el);
		}
		else {
			var mult = (element[i_piv_col] * (-1)) / piv_el;
			var s1 = element;
			var s2 = math.multiply(row_piv, mult);
			r_values[index] = math.add(s1, s2);
		}
	});

	var mult = (fo_values[i_piv_col] * (-1)) / piv_el;
	var s1 = fo_values;
	var s2 = math.multiply(row_piv, mult);
	fo_values = math.add(s1, s2);

	var tablemdc = new TableSimplexMDCModel(head_vd, fst_vb, r_values, fo_values);
	$("#box-data-table #tables-solutions").append(tablemdc.toJqueryDOM());
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, "#box-data-table #tables-solutions"]);

	json = {
		restrictions: r_values,
		objfunction: fo_values,
		result: {}
	};

	fst_vb.forEach( (element, index) => {
		if (regex.test(element)) {
			var t = element.replace(regex, '');
			json.result[t.replace(/\u0028|\u0029/gu, '')] = r_values[index][n-1];
		}
	});
	var tip = $("input[name=radios]:checked").val();

	if (tip === "min") {
		json.result['Z'] = fo_values[n-1] * (-1);
	}
	else {
		json.result['Z'] = fo_values[n-1];
	}

	console.log(json);
	console.log(head_vd, fst_vb);

	return json;
}

function isInfinite(number) {
	if (math.isNumeric(number) && (number == -Infinity || number == Infinity)) {
		return true;
	}
	else {
		return false;
	}
}

function isComplex(number) {
	if (!math.isNumeric(number) && math.isComplex(number)) {
		return true;
	}
	else {
		return false;
	}
}

function evaluate(text) {
	var number = NaN;
	try {
		number = math.evaluate(text);
	} catch(e) {
		console.error(e);
	}
	if (typeof number === "undefined") {
		number = 0;
	}
	return number;
}

function isNumber(text) {
	if (typeof text === "number") {
		return (!isNaN(text));
	}
	else {
		var n = parseFloat(text);
		return (!isNaN(text));
	}
}

// efectos Material Desing Components
function efectsMDC() {
	//const buttonRipple = new MDCRipple(document.querySelector('.mdc-button'));
	//mdc.ripple.MDCRipple.attachTo(document.querySelector('.mdc-button'));
	mdc.autoInit();
	// var dialog = new mdc.dialog.MDCDialog(document.querySelector('.mdc-dialog'));
	// dialog.open();
	const MDCRipple = mdc.ripple.MDCRipple;
	// const MDCSelect = mdc.select.MDCSelect;
	// const iconButtonRipple = new MDCRipple(document.querySelector('.mdc-icon-button'));
	// iconButtonRipple.unbounded = true;
	var iconButtons = document.querySelectorAll('.mdc-icon-button');
	Array.prototype.forEach.call(iconButtons, function(item) {
		const iconButton = new MDCRipple(item);
		iconButton.unbounded = true;
	});

	const drawer = mdc.drawer.MDCDrawer.attachTo(document.querySelector('.mdc-drawer'));
	const topAppBar = mdc.topAppBar.MDCTopAppBar.attachTo(document.getElementById('app-bar'));
	topAppBar.setScrollTarget(document.getElementById('main-content'));
	topAppBar.listen('MDCTopAppBar:nav', () => {
		drawer.open = !drawer.open;
	});

	// cambiar la grilla de los inputs, cambiando sus clases
	resize_grid_inputs();

	var tables = document.querySelectorAll('.mdc-data-table');
	Array.prototype.forEach.call(tables, (table) => mdc.dataTable.MDCDataTable.attachTo(table));

	// Para las tablas editables
	$('#table-rest.editable').editableTableWidget({
		dontEdits: [3],
		dynamic: true
	});
	$('#table-funcion_z.editable').editableTableWidget();


	// const menu = mdc.menu.MDCMenu.attachTo(document.querySelector('.mdc-menu'));
	// menu.open = false;

	// Selectores
	// var selectors = document.querySelectorAll('.mdc-select');
	// Array.prototype.forEach.call(selectors, function(item) {
	// 	const select = new MDCSelect(item);
	// 	select.listen('MDCSelect:change', () => {
	// 		//alert(`Selected option at index ${select.selectedIndex} with value "${select.value}"`);
	// 	});
	// });
}

// function refreshEditableTable(table) {
// 	$(table).editableTableWidget();
// }

function addRow(table, row, n_row_insert) {
	var nColumn = $(table + " tr:last td").length;
	var fst_tr = $(table + " tbody").find('tr')[row];
	for (var i = 0; i < n_row_insert; i++) {
		var tr = $('<tr>', {
			'class' : 'mdc-data-table__row'
		});
		for (var i = 0; i < nColumn; i++) {
			var td = $('<td>', {
				'class' : 'mdc-data-table__cell'
			});
			if (i == nColumn-2) {
				var select = $('<select>', {
					'name': 'condition'
				});
				conditionals.forEach( function(item, index) {
					var option = $('<option>', {
						'value': item.value,
						'text': Encoder.htmlDecode(item.text)
					});
					select.append(option);
				});
				td.append(select);
			}
			tr.append(td);
		}
		$(fst_tr).after(tr);
	}
}

function rmRow(table, row) {
	var num_row = $("#table-rest tbody tr").length;
	if(num_row > 1 && row < num_row)
	{
		var fst_tr = $(table + " tbody").find('tr')[row];
		// Eliminamos la fila requerida
		$(fst_tr).remove();
	}
}

function addColumn(table, column, n_col_insert, last_rest_int) {
	$(table).find('tr').each(function(index, row) {
		var fst_td = $(row).find('td, th')[column];
		if (fst_td.tagName == 'TH') {
			//var nColumn = $(table + " tr:last td").length;
			for (var i = 0; i < n_col_insert; i++) {
				var text = '\\(X_{' + (last_rest_int + i + 1) + '}\\)';
				var th = $('<th>', {
					'class' : 'mdc-data-table__header-cell',
					'role': 'columnheader',
					'scope': 'col',
					'text': text
				});
				$(fst_td).after(th);
			}
		} 
		else {
			for (var i = 0; i < n_col_insert; i++) {
				var td = $('<td>', {
					'class' : 'mdc-data-table__cell'
				});
				$(fst_td).after(td);
			}
		}
	});
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, table]);
}

function rmColumn(table, column) {
	$(table).find('tr').each(function(index, row) {
		var nColumn = $(table + " tr:last td").length;
		if (nColumn > 1) {
			var fst_td = $(row).find('td, th')[column];
			$(fst_td).remove();
		}
	});
}

function resize_grid_inputs() {
	var win_width = $(window).width();
	var divs = $("#text-field-grid-change").children('div.input-change-grid');
	if (win_width > 839) {
		divs.each( function(index, item) {
			if ($(item).hasClass('mdc-layout-grid__cell')) {
				$(item).removeClass('mdc-layout-grid__cell');
				$(item).addClass('mdc-layout-grid__cell--span-6');
			}
		});
	}
	else {
		console.log("entro");
		divs.each( function(index, item) {
			if ($(item).hasClass('mdc-layout-grid__cell--span-6')) {
				$(item).removeClass('mdc-layout-grid__cell--span-6');
				$(item).addClass('mdc-layout-grid__cell');
			}
		});
	}
}