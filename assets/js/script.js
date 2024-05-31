import { interpolateColor, generateArrayEqualSteps } from "./utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  const [dataTopoJSON, databachelorsOrHigherJSON] = await Promise.all([
    d3.json(
      "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json"
    ),
    d3.json(
      "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json"
    ),
  ]);

  // Creación de mapa de fips json a datos
  const dataMap = new Map(databachelorsOrHigherJSON.map((d) => [d.fips, d]));

  // Creación de escala de colores

  const arrayMinMaxBachelorsData = d3.extent(
    databachelorsOrHigherJSON,
    (d) => d.bachelorsOrHigher
  );
  const colorScale = d3.scaleSequential(
    arrayMinMaxBachelorsData,
    d3.interpolateTurbo
  );

  // Manipulación de counties and states topojson

  const counties = topojson.feature(
    dataTopoJSON,
    dataTopoJSON.objects.counties
  );

  const states = topojson.mesh(
    dataTopoJSON,
    dataTopoJSON.objects.states,
    (a, b) => a !== b
  );

  const nation = topojson.mesh(dataTopoJSON, dataTopoJSON.objects.nation);

  // creación de medidas de ancho y altura
  const margin = { top: 150, right: 10, bottom: 100, left: 100 };
  const width = 1100 - margin.left - margin.right;
  const height = 800 - margin.top - margin.bottom;

  // creación de SVG
  const svg = d3
    .select(".container_grafico")
    .html("")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("background-color", "#f5f5f5");

  // rendereo de paths de counties

  const contenedor = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  contenedor
    .selectAll("path")
    .data(counties.features)
    .enter()
    .append("path")
    .attr("d", d3.geoPath())
    .attr("fill", (d) => colorScale(dataMap.get(d.id).bachelorsOrHigher))
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.2)
    .attr("class", "county")
    .attr("data-fips", (d) => d.id)
    .attr("data-education", (d) => dataMap.get(d.id).bachelorsOrHigher);

  //rendereo de paths de states
  const contenedor2 = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  contenedor2
    .append("path")
    .datum(states)
    .attr("d", d3.geoPath())
    .attr("stroke", "#000")
    .attr("stroke-width", 1)
    .attr("fill", "none");

  //rendereo de paths de nation
  const contenedor3 = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  contenedor3
    .append("path")
    .datum(nation)
    .attr("d", d3.geoPath())
    .attr("stroke", "#000")
    .attr("stroke-width", 1)
    .attr("fill", "none");

  // creacion de tooltip
  const tooltip = d3
    .select(".container_grafico")
    .append("div")
    .attr("id", "tooltip")
    .style("display", "none");

  // agregando tooltips a counties en mouse over
  contenedor
    .selectAll(".county")
    .data(counties.features)
    .on("mouseover", function (event, d) {
      const [x, y] = d3.pointer(event);

      const county = dataMap.get(d.id);
      const percentage = county.bachelorsOrHigher;
      tooltip.style("display", "flex").html(
        `<div><strong>County: </strong>${county.area_name}</div>
          <div> <strong>Percentage: </strong>${percentage}%</div>`
      );

      const tooltipElement = document.getElementById("tooltip");
      const xPosition =
        x > 750 ? x + margin.left - 170 - 20 : x + margin.left + 20;

      const yPosition = y > 500 ? y - tooltipElement.offsetHeight : y;
      tooltip
        .style("left", xPosition + "px")
        .style("top", yPosition + margin.top + "px")
        .attr("data-education", percentage);

      tooltipElement.style.setProperty(
        "--box-shadow-color",
        colorScale(dataMap.get(d.id).bachelorsOrHigher)
      );
    })
    .on("mouseout", function () {
      tooltip.style("display", "none").attr("data-education", "");
    });
  //creación de legenda

  const scaleColorLegend = d3
    .scaleLinear()
    .domain(arrayMinMaxBachelorsData)
    .range([0, 300]);

  const ejeLegend = d3
    .axisBottom(scaleColorLegend)
    .tickSize(6)
    .tickValues(
      generateArrayEqualSteps(
        arrayMinMaxBachelorsData[0],
        arrayMinMaxBachelorsData[1],
        8
      )
    )
    .tickFormat((d) => d.toFixed(2))
    .tickSizeInner(12);

  const legend = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top / 2})`)
    .call(ejeLegend);

  // creacion de rectangulo de color de legenda

  const linearGradient = legend
    .append("defs")
    .append("linearGradient")
    .attr("id", "linear-gradient");

  for (let i = 0; i <= 100; i++) {
    linearGradient
      .append("stop")
      .attr("offset", i + "%")
      .attr("stop-color", interpolateColor(i / 100));
  }

  legend
    .append("rect")
    .attr("x", 0)
    .attr("y", -30)
    .attr("width", 300)
    .attr("height", 30)
    .attr("fill", "url(#linear-gradient)");

  // creacion de titulo legend

  legend
    .append("text")
    .attr("x", 140)
    .attr("y", -50)
    .text("Continuous Color Scale")
    .attr("font-size", "12px")
    .attr("fill", "black")
    .attr("font-weight", "bold");

  // creacion de leyenda adicional

  const arrayTicksValues = generateArrayEqualSteps(
    arrayMinMaxBachelorsData[0],
    arrayMinMaxBachelorsData[1],
    8
  );

  const amplitudDominio =
    arrayTicksValues[arrayTicksValues.length - 1] - arrayTicksValues[0];

  const anchoStep = arrayTicksValues[1] - arrayTicksValues[0];

  const scaleColorLegendAdditional = d3
    .scaleLinear()
    .domain([
      arrayMinMaxBachelorsData[0],
      arrayMinMaxBachelorsData[1] + anchoStep,
    ])
    .range([400, 700]);

  const ejeLegendAdditional = d3
    .axisBottom(scaleColorLegendAdditional)
    .tickSize(6)
    .tickValues([
      ...arrayTicksValues,
      arrayTicksValues[arrayTicksValues.length - 1] + anchoStep,
    ])
    .tickFormat((d, i) => {
      return i === arrayTicksValues.length ? "" : d.toFixed(2);
    })
    .tickSizeInner(12);

  const legendAdditional = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top / 2})`)
    .attr("id", "legend")
    .call(ejeLegendAdditional);

  // creacion de titulo de legend additional

  legendAdditional
    .append("text")
    .attr("x", 550)
    .attr("y", -50)
    .text("Discrete color scale")
    .attr("font-size", "12px")
    .attr("fill", "black")
    .attr("font-weight", "bold");

  // creacion de rectangulos de color de leyenda adicional
  const widthRectangleAdditionalLegend =
    scaleColorLegendAdditional(arrayTicksValues[1]) -
    scaleColorLegendAdditional(arrayTicksValues[0]);

  legendAdditional
    .selectAll("rect")
    .data(arrayTicksValues)
    .enter()
    .append("rect")
    .attr("x", (d) => scaleColorLegendAdditional(d))
    .attr("y", -30)
    .attr("width", widthRectangleAdditionalLegend)
    .attr("height", 30)
    .attr("fill", (d) => d3.interpolateTurbo(d / amplitudDominio));
});
