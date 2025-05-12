import { Request, Response } from "express";
import { DynamicRecord } from "../models/record.model"; // Para crear el primer registro
import Table from "../models/table.model";

// 🔹 Crear nueva tabla + primer DynamicRecord
export const createTable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug, icon, isAIEnabled } = req.body;

    if (!name || !slug || !icon) {
      res.status(400).json({ message: "Nombre, icono y slug son requeridos." });
      return;
    }

    const existing = await Table.findOne({ slug });
    if (existing) {
      res.status(400).json({ message: "Ya existe una tabla con ese slug." });
      return;
    }

    const newTable = new Table({
      name,
      slug,
      icon,
      isAIEnabled: isAIEnabled || false, // Por defecto, IA deshabilitada
    });

    await newTable.save();

    res.status(201).json({ message: "Tabla creada exitosamente.", table: newTable });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear la tabla." });
  }
};

// 🔹 Obtener todas las tablas
export const getAllTables = async (_req: Request, res: Response) => {
  try {
    const tables = await Table.find();
    res.json(tables);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener las tablas." });
  }
};

// 🔹 Obtener una tabla específica por slug
export const getTableBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const table = await Table.findOne({ slug });

    if (!table) {
      res.status(404).json({ message: "Tabla no encontrada." });
      return;
    }

    res.json(table);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener la tabla." });
  }
};

// 🔹 Actualizar tabla con el id
export const updateTableById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, slug, icon, isAIEnabled } = req.body;

    const table = await Table.findById(id);
    if (!table) {
      res.status(404).json({ message: "Tabla no encontrada." });
      return;
    }
    const oldSlug = table.slug; // Guardamos el slug anterior por si cambia
    if (name) table.name = name;
    if (slug) table.slug = slug;
    if (icon) table.icon = icon;
    if (typeof isAIEnabled === "boolean") table.isAIEnabled = isAIEnabled;

    await table.save();
    // 🔥 Si el slug cambió, también actualizamos todos los DynamicRecords
    if (slug && oldSlug !== slug) {
      await DynamicRecord.updateMany({ tableSlug: oldSlug }, { $set: { tableSlug: slug } });
    }
    res.json({ message: "Tabla actualizada correctamente.", table });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar la tabla." });
  }
};

// 🔥 Eliminar tabla y sus registros por el id
export const deleteTable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const table = await Table.findByIdAndDelete(id);

    if (!table) {
      res.status(404).json({ message: "Tabla no encontrada para eliminar." });
      return;
    }

    // 🔥 También eliminamos todos los registros relacionados
    await DynamicRecord.deleteMany({ tableSlug: table.slug });

    res.json({ message: "Tabla y sus registros eliminados correctamente." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar la tabla." });
  }
};
