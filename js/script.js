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

// Matriz N x M donde estan los valores de las ecuaciones lineales
class MatrizEq {
	constructor(array) {
		if (typeof array === "object" && array.length) {
			this.matriz = array;
		}
		else {
			throw new TypeError("El parametro array_A no es un array");
		}
	}

	calculateMaxs() {
		var matrizA = [];
		var arrayMaxs = [];
		this.matriz.forEach(function(element) {
			var arr = [];
			element.forEach(function(item, index) {
				if (index < element.length - 1) {
					arr.push(item);
				}
			});
			matrizA.push(arr);
		});
		matrizA = math.max(math.abs(matrizA), 1);
		this.matriz.forEach(function(element, i) {
			var arr = [];
			element.forEach(function(item, j) {
				if (j < element.length - 1) {
					if (item == matrizA[i]) {
						arr.push(item);
						arr.push(j);
					}
				}
			});
			arrayMaxs.push(arr);
		});
		this.maxsA = arrayMaxs;
		return this.maxsA;
	}

	sort(compareFunction) {
		if (arguments.length === 0) {
			this.calculateMaxs();
			this.matriz.sort((rowi, rowj) => {
				return this.compareDiagNum(rowi, rowj);
			});
		}
		else {
			if (typeof compareFunction === "function") {
				this.matriz.sort(compareFunction);
			}
			else {
				throw new TypeError("El parametro compareFunction no es una función");
			}
		}
	}

	compareDiagNum(rowi, rowj) {
		var i = this.matriz.indexOf(rowi);
		var j = this.matriz.indexOf(rowj);
		if (this.maxsA[i][0] < this.maxsA[j][0]) {
			if (this.maxsA[i][1] > this.maxsA[j][1]) {
				return 1;
			}
			else if (this.maxsA[i][1] == this.maxsA[j][1]) {
				return this.compareNumbers(rowi[this.maxsA[i][1]], rowj[this.maxsA[i][1]]);
			}
			return -1;
		}
		if (this.maxsA[i][0] > this.maxsA[j][0]) {
			if (this.maxsA[i][1] > this.maxsA[j][1]) {
				return 1;
			}
			else if (this.maxsA[i][1] == this.maxsA[j][1]) {
				return this.compareNumbers(rowi[this.maxsA[i][1]], rowj[this.maxsA[i][1]]);
			}
			return 1;
		}
		if (this.maxsA[i][0] == this.maxsA[j][0]) {
			if (this.maxsA[i][1] > this.maxsA[j][1]) {
				return 1;
			}
			else if (this.maxsA[i][1] == this.maxsA[j][1]) {
				return this.compareNumbers(rowi[this.maxsA[i][1]], rowj[this.maxsA[i][1]]);
			}
			return 0;
		}
	}

	compareNumbers(a, b) {
		if (a < b) {
			return -1;
		}
		if (a > b) {
			return 1;
		}
		return 0;
	}

	hasDiagDominant() {
		var dominante = true;
		for (var i = 0; i < this.matriz.length; i++) {
			var sum = 0;
			var diag;
			for (var j = 0; j < this.matriz[i].length - 1; j++) {
				if (i == j) {
					diag = math.abs(this.matriz[i][j]);
				}
				else {
					sum += math.abs(this.matriz[i][j]);
				}
			}
			if (diag <= sum) {
				dominante = false;
				break;
			}
		}
		return dominante;
	}

	getMatriz() {
		return this.matriz;
	}

	toString() {
		return JSON.stringify(this.matriz);
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

	// $("input[name=p1]").prop('disabled', true);
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

	// $("input#interval").click(function(event) {
	// 	if($(this).is(':checked')) {
	// 		$("input[name=p1]").prop('disabled', false);
	// 		$("input[name=p2]").prop('disabled', false);
	// 	}
	// 	else {
	// 		$("input[name=p1]").prop('disabled', true);
	// 		$("input[name=p2]").prop('disabled', true);
	// 	}
	// });

	$("#form-data-solution").submit(function(event) {
		event.preventDefault();
		calculate_solution();
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
		var last_col = $("#table-rest tr:last td").length - 1;
		addColumn("#table-rest", last_col, 1);
	});

	$("button#rm-column-table").click(function(event) {
		var last_col = $("#table-rest tr:last td").length - 1;
		rmColumn("#table-rest", last_col);
	});

	$("button#clear-data").click(function(event) {
		$("input#funcion_z").val("");
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
	resize_grid_inputs();
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
function calculate_solution() {
	var fz = $("input#funcion_z").val();

	if (fz !== "") {
		var array2D = [];
		$("#table-rest tbody tr").find("td").each(function() {
			if($(this).html() !== "") {
				var objRst = new LinealEquation($(this).html());
				array2D.push(objRst.transArray());
			}
		});
		var objMatriz = new MatrizEq(array2D);
		console.log(objMatriz.toString());
		console.log(objMatriz.getMatriz());

		// var exp = new FuncionMath(fx);
		// var str_a = $("input[name=valorA]").val();
		// var str_b = $("input[name=valorB]").val();
		// var str_iter = $("input[name=n_iter]").val();
		
		// if (str_a !== "" && str_b !== "" && str_iter !== "") {
		// 	var a = parseFloat(str_a);
		// 	var b = parseFloat(str_b);
		// 	var fa = exp.evaluate(a);
		// 	var fb = exp.evaluate(b);
		// 	// Verificar si hay continuidad en el intervalo
		// 	if (isInfinite(fa) || isComplex(fa) || isInfinite(fb) || isComplex(fb)) {
		// 		alert("La función no es continua en el intervalo [" + a + ", " + b + "]");
		// 	}
		// 	else {
		// 		// Verificar si f(a).f(b) < 0
		// 		if (fa * fb < 0) {
		// 			// Generar tabla y calcular raiz
		// 			var nIter = parseInt(str_iter);
		// 			if (nIter < 1) {
		// 				alert("El número de iteracciones debe ser mayor o igual a 1");
		// 			}
		// 			else {
		// 				var i = 0;
		// 				var Xi = a;
		// 				var Xs = b;
		// 				var XmAnt = 0;
		// 				var Xm;
		// 				var Ea, Er, Ep;
		// 				var tbody;
		// 				do {
		// 					Xm = (Xi + Xs) / 2;

		// 					var fXi = exp.evaluate(Xi);
		// 					var fXs = exp.evaluate(Xs);
		// 					var fXm = exp.evaluate(Xm);

		// 					Ea = math.abs(Xm - XmAnt);
		// 					Er = Ea / Xm;
		// 					Ep = Er * 100;

		// 					// Crear la fila para la iteraccion actual
		// 					tbody += "<tr>";
		// 					tbody += "<td>" + (i + 1) + "</td>";
		// 					tbody += "<td class='mdc-data-table--numeric'>" + Xi + "</td>";
		// 					tbody += "<td class='mdc-data-table--numeric'>" + Xs + "</td>";
		// 					tbody += "<td class='mdc-data-table--numeric'>" + Xm + "</td>";
		// 					tbody += "<td class='mdc-data-table--numeric'>" + fXi + "</td>";
		// 					tbody += "<td class='mdc-data-table--numeric'>" + fXm + "</td>";
		// 					tbody += "<td class='mdc-data-table--numeric'>" + (fXi * fXm) + "</td>";
		// 					tbody += "<td class='mdc-data-table--numeric'>" + Ea + "</td>";
		// 					tbody += "<td class='mdc-data-table--numeric'>" + Er + "</td>";
		// 					tbody += "<td class='mdc-data-table--numeric'>" + Ep + "</td>";
		// 					tbody += "</tr>";

		// 					if (fXm == 0) {
		// 						break;
		// 					}

		// 					if (fXi * fXm < 0) {
		// 						Xs = Xm;
		// 					}
		// 					else if (fXi * fXm > 0) {
		// 						Xi = Xm;
		// 					}

		// 					if (XmAnt == Xm) {
		// 						break;
		// 					}
		// 					XmAnt = Xm;
		// 					i++;
		// 				} while (i < nIter)
		// 				$("input[name=sqrt_result]").val(Xm);
		// 				$("table#table-sqrt tbody").html(tbody);
		// 				var table = document.querySelector('#box-data-table .mdc-table-overflow');
		// 				new MDCDataTable(table);
		// 			}
		// 		}
		// 		else {
		// 			alert("Intervalo [" + a + ", " + b + "] invalido: f(a).f(b) >= 0");
		// 		}
		// 	}
		// }
	}
	else {
		alert("Primero ingrese la función objetivo");
	}
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

// efectos Material Desing Components
function efectsMDC() {
	//const buttonRipple = new MDCRipple(document.querySelector('.mdc-button'));
	//mdc.ripple.MDCRipple.attachTo(document.querySelector('.mdc-button'));
	mdc.autoInit();
	// var dialog = new mdc.dialog.MDCDialog(document.querySelector('.mdc-dialog'));
	// dialog.open();
	const MDCRipple = mdc.ripple.MDCRipple;
	// const iconButtonRipple = new MDCRipple(document.querySelector('.mdc-icon-button'));
	// iconButtonRipple.unbounded = true;
	var iconButtons = document.querySelectorAll('.mdc-icon-button');
	Array.prototype.forEach.call(iconButtons, function(item) {
		iconButton = new MDCRipple(item);
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
	$('.editable').editableTableWidget();
}

function refreshEditableTable(table) {
	$(table).editableTableWidget();
}

function addRow(table, row, n_row_insert) {
	var nColumn = $(table + " tr:last td").length;
	var fst_tr = $(table + " tbody").find('tr')[row];
	for (var i = 0; i < n_row_insert; i++) {
		var tr = $('<tr>', {
			'class' : 'mdc-data-table__row'
		});
		for (var i = 0; i < nColumn; i++) {
			var td = $('<td>', {
				'class' : 'mdc-data-table__cell',
				'tabindex': '1'
			});
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
		// $("#table-rest tbody tr:last").remove();
		$(fst_tr).remove();
	}
}

function addColumn(table, column, n_col_insert) {
	$(table).find('tr').each(function(index, row) {
		var fst_td = $(row).find('td, th')[column];
		if (fst_td.tagName == 'TH') {
			var nColumn = $(table + " tr:last td").length;
			for (var i = 0; i < n_col_insert; i++) {
				var text = '\\(X_' + (nColumn + i + 1) + '\\)';
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
					'class' : 'mdc-data-table__cell',
					'tabindex': '1'
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