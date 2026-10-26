export interface Employee {
  id: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  sueldo_base_mensual: number;
  fecha_ingreso: string;
  dias_vacaciones: number;
  aguinaldo: number | null;
}

export interface EmployeePayload {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  sueldo_base_mensual: number | null;
  fecha_ingreso: string;
}
