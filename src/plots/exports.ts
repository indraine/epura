import ExcelJS from "exceljs"
import type { BeamSetup, PlotData } from "../core/types"
import type { CalculationRecord } from "../core/db"
import { getLastCalculation } from "../core/db"

const formatSheet = (sheet: ExcelJS.Worksheet, columnCount: number) => {
    sheet.getRow(1).font = { bold: true }
    for (let i = 1; i <= columnCount; i++) {
        sheet.getColumn(i).width = 18
    }
}

const boldLastRow = (sheet: ExcelJS.Worksheet) => {
    sheet.getRow(sheet.rowCount).font = { bold: true }
}

const addStressStateSheet = (workbook: ExcelJS.Workbook, data: PlotData) => {
    const sheet = workbook.addWorksheet("НДС")
    sheet.addRow(["x (координата)", "u (прогиб)"])
    const maxLength = Math.max(
        data.stress_state.interpolate_points.length,
        data.stress_state.interpolated_curve.length
    )
    for (let i = 0; i < maxLength; i++) {
        sheet.addRow([
            data.stress_state.interpolate_points[i] ?? 0,
            data.stress_state.interpolated_curve[i] ?? 0,
        ])
    }
    formatSheet(sheet, 2)
}

/** Лист с сосредоточенными и распределёнными нагрузками (+ реакции). */
const addLoadsSheet = (
    workbook: ExcelJS.Workbook,
    data: PlotData,
    setup?: BeamSetup | null
) => {
    const sheet = workbook.addWorksheet("Нагрузки")
    const coords = data.stress_state.coords

    sheet.addRow(["Сосредоточенные нагрузки"])
    boldLastRow(sheet)
    sheet.addRow(["№", "x (координата)", "P (Н)"])
    boldLastRow(sheet)

    const pointLoads = setup?.pl?.length
        ? setup.pl.map(pl => ({ coord: pl.coord, value: pl.value }))
        : data.point_loads.map(load => ({
              coord: coords[load.node_index] ?? 0,
              value: load.value,
          }))

    if (pointLoads.length === 0) {
        sheet.addRow(["—", "нет", "—"])
    } else {
        pointLoads.forEach((load, idx) => {
            sheet.addRow([idx + 1, load.coord, load.value])
        })
    }

    sheet.addRow([])
    sheet.addRow(["Распределённые нагрузки"])
    boldLastRow(sheet)
    sheet.addRow(["№", "x нач.", "x кон.", "q (Н/мм)"])
    boldLastRow(sheet)

    const distributedLoads = setup?.dl?.length
        ? setup.dl.map(dl => ({
              start: dl.start_coord,
              end: dl.end_coord,
              value: dl.value,
          }))
        : data.distributed_loads.map(load => {
              const startIdx = load.node_indices[0] ?? 0
              const endIdx =
                  load.node_indices[load.node_indices.length - 1] ?? startIdx
              return {
                  start: coords[startIdx] ?? 0,
                  end: coords[endIdx] ?? 0,
                  value: load.value,
              }
          })

    if (distributedLoads.length === 0) {
        sheet.addRow(["—", "нет", "нет", "—"])
    } else {
        distributedLoads.forEach((load, idx) => {
            sheet.addRow([idx + 1, load.start, load.end, load.value])
        })
    }

    if (data.reactions?.length) {
        sheet.addRow([])
        sheet.addRow(["Опорные реакции"])
        boldLastRow(sheet)
        sheet.addRow(["№", "x (координата)", "R (Н)"])
        boldLastRow(sheet)
        data.reactions.forEach((reaction, idx) => {
            sheet.addRow([
                idx + 1,
                coords[reaction.node_index] ?? 0,
                reaction.value,
            ])
        })
    }

    formatSheet(sheet, 4)
}

const addModesSheet = (workbook: ExcelJS.Workbook, data: PlotData) => {
    const sheet = workbook.addWorksheet("Моды")
    const headerRow = [
        "x (координата)",
        ...data.modes.modes.map((_, idx) => `Мода ${idx + 1}`),
    ]
    sheet.addRow(headerRow)
    const maxLength = Math.max(
        data.modes.interpolate_points.length,
        ...data.modes.modes.map(m => m.interpolated_curve.length)
    )
    for (let i = 0; i < maxLength; i++) {
        const row = [
            data.modes.interpolate_points[i] ?? 0,
            ...data.modes.modes.map(m => m.interpolated_curve[i] ?? 0),
        ]
        sheet.addRow(row)
    }
    formatSheet(sheet, data.modes.modes.length + 1)
}

const addXYSheet = (
    workbook: ExcelJS.Workbook,
    title: string,
    xLabel: string,
    yLabel: string,
    xs: number[] | undefined,
    ys: number[] | undefined,
    fallbackXs?: number[],
    fallbackYs?: number[]
) => {
    const x = xs && xs.length > 0 ? xs : (fallbackXs ?? [])
    const y = ys && ys.length > 0 ? ys : (fallbackYs ?? [])
    if (x.length === 0 || y.length === 0) return

    const sheet = workbook.addWorksheet(title)
    sheet.addRow([xLabel, yLabel])
    const maxLength = Math.max(x.length, y.length)
    for (let i = 0; i < maxLength; i++) {
        sheet.addRow([x[i] ?? 0, y[i] ?? 0])
    }
    formatSheet(sheet, 2)
}

const addShearForceSheet = (workbook: ExcelJS.Workbook, data: PlotData) => {
    if (!data.shear_force) return
    addXYSheet(
        workbook,
        "Поперечные силы",
        "x (координата)",
        "Q (поперечная сила)",
        data.shear_force.interpolate_points,
        data.shear_force.interpolated_curve,
        data.shear_force.coords,
        data.shear_force.node_values
    )
}

const addBendingMomentSheet = (workbook: ExcelJS.Workbook, data: PlotData) => {
    if (!data.bending_moment) return
    addXYSheet(
        workbook,
        "Изгибающие моменты",
        "x (координата)",
        "M (изгибающий момент)",
        data.bending_moment.interpolate_points,
        data.bending_moment.interpolated_curve,
        data.bending_moment.coords,
        data.bending_moment.node_values
    )
}

const downloadWorkbook = async (
    workbook: ExcelJS.Workbook,
    filename: string
) => {
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

export const createWorkbookFromPlotData = (
    data: PlotData,
    setup?: BeamSetup | null
): ExcelJS.Workbook => {
    const workbook = new ExcelJS.Workbook()
    addStressStateSheet(workbook, data)
    addModesSheet(workbook, data)
    addShearForceSheet(workbook, data)
    addBendingMomentSheet(workbook, data)
    addLoadsSheet(workbook, data, setup)
    return workbook
}

export const downloadCurrentAsXLSX = async (
    plotData: PlotData
): Promise<void> => {
    const lastRecord = await getLastCalculation()
    const workbook = createWorkbookFromPlotData(plotData, lastRecord?.setup)
    const calculationId = lastRecord?.id || "unknown"
    await downloadWorkbook(workbook, `beam-calculation_${calculationId}.xlsx`)
}

/** @returns false, если в записи нет данных расчёта (ошибка). */
export const downloadAsXLSX = async (
    record: CalculationRecord
): Promise<boolean> => {
    if (!record.data) {
        return false
    }
    const workbook = createWorkbookFromPlotData(record.data, record.setup)
    await downloadWorkbook(workbook, `calculation_${record.id}.xlsx`)
    return true
}

export const downloadAsJSON = (record: CalculationRecord): void => {
    const dataStr = JSON.stringify(record, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `calculation_${record.id}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

export type StackedPlotPanel = {
    /** data URL from Plotly.toImage */
    dataUrl: string
    /** Short label drawn above the panel (e.g. "НДС", "Q", "M") */
    label: string
}

export type StackedPngOptions = {
    filename?: string
    background?: string
    labelColor?: string
    gapPx?: number
    labelHeightPx?: number
    paddingPx?: number
}

const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () =>
            reject(new Error("Не удалось загрузить изображение графика"))
        img.src = src
    })

const triggerBlobDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * Склеивает эпюры НДС / Q / M в один PNG — как в учебниках по сопромату:
 * три графика друг под другом с общей горизонтальной осью по ширине.
 */
export const downloadStackedEpuresPng = async (
    panels: StackedPlotPanel[],
    options: StackedPngOptions = {}
): Promise<void> => {
    if (panels.length === 0) {
        throw new Error("Нет графиков для экспорта")
    }

    const {
        filename = "beam-epures-nds-q-m.png",
        background = "#FFFFFF",
        labelColor = "#191B23",
        gapPx = 12,
        labelHeightPx = 28,
        paddingPx = 16,
    } = options

    const images = await Promise.all(panels.map(p => loadImage(p.dataUrl)))
    const panelWidth = Math.max(...images.map(img => img.width))
    const contentWidth = panelWidth + paddingPx * 2
    const contentHeight =
        paddingPx * 2 +
        images.reduce((sum, img) => sum + labelHeightPx + img.height, 0) +
        gapPx * Math.max(0, images.length - 1)

    const canvas = document.createElement("canvas")
    canvas.width = contentWidth
    canvas.height = contentHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) {
        throw new Error("Canvas 2D недоступен")
    }

    ctx.fillStyle = background
    ctx.fillRect(0, 0, contentWidth, contentHeight)

    ctx.font = `600 16px "Source Code Pro", ui-monospace, monospace`
    ctx.fillStyle = labelColor
    ctx.textBaseline = "middle"

    let y = paddingPx
    for (let i = 0; i < images.length; i++) {
        const img = images[i]
        const label = panels[i].label
        ctx.fillText(label, paddingPx, y + labelHeightPx / 2)
        y += labelHeightPx

        const x = paddingPx + Math.floor((panelWidth - img.width) / 2)
        ctx.drawImage(img, x, y)
        y += img.height

        if (i < images.length - 1) {
            y += gapPx
        }
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(result => {
            if (result) resolve(result)
            else reject(new Error("Не удалось сформировать PNG"))
        }, "image/png")
    })

    triggerBlobDownload(
        blob,
        filename.endsWith(".png") ? filename : `${filename}.png`
    )
}
