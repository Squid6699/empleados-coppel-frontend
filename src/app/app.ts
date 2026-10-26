import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, map, switchMap } from 'rxjs';

interface ApiEmployee {
  id: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  sueldo_base_mensual: number;
  fecha_ingreso: string;
}

interface Employee extends ApiEmployee {
  diasVacaciones: number;
  aguinaldo: number;
}

interface EmployeeForm {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  sueldoBaseMensual: number | null;
  fechaIngreso: string;
}

@Component({
  imports: [FormsModule, CurrencyPipe, DatePipe],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/empleados';

  employees: Employee[] = [];
  form: EmployeeForm = this.emptyForm();
  editingId: number | null = null;
  isFormVisible = false;
  isLoading = false;
  isSaving = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.http.get<ApiEmployee[]>(this.apiUrl).pipe(
      switchMap((employees) => employees.length
        ? forkJoin(employees.map((employee) => forkJoin({
            vacation: this.http.get<{ diasVacaciones?: number; dias_vacaciones?: number }>(`${this.apiUrl}/${employee.id}/vacaciones`),
            bonus: this.http.get<{ aguinaldo: number }>(`${this.apiUrl}/${employee.id}/aguinaldo`),
          }).pipe(
            map(({ vacation, bonus }) => ({
              ...employee,
              diasVacaciones: vacation.diasVacaciones ?? vacation.dias_vacaciones ?? 0,
              aguinaldo: bonus.aguinaldo,
            }))
          )))
        : [[]]),
    ).subscribe({
      next: (employees) => {
        this.employees = employees as Employee[];
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar la información. Verifica que el backend esté disponible.';
        this.isLoading = false;
      },
    });
  }

  startCreating(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.errorMessage = '';
    this.isFormVisible = true;
  }

  startEditing(employee: Employee): void {
    this.editingId = employee.id;
    this.form = {
      nombre: employee.nombre,
      apellidoPaterno: employee.apellido_paterno,
      apellidoMaterno: employee.apellido_materno ?? '',
      sueldoBaseMensual: employee.sueldo_base_mensual,
      fechaIngreso: employee.fecha_ingreso,
    };
    this.errorMessage = '';
    this.isFormVisible = true;
  }

  closeForm(): void {
    if (!this.isSaving) this.isFormVisible = false;
  }

  save(): void {
    this.isSaving = true;
    this.errorMessage = '';
    const request = {
      nombre: this.form.nombre,
      apellido_paterno: this.form.apellidoPaterno,
      apellido_materno: this.form.apellidoMaterno || null,
      sueldo_base_mensual: this.form.sueldoBaseMensual,
      fecha_ingreso: this.form.fechaIngreso,
    };
    const operation = this.editingId
      ? this.http.put(`${this.apiUrl}/${this.editingId}`, request)
      : this.http.post(this.apiUrl, request);
    operation.subscribe({
      next: () => {
        this.isSaving = false;
        this.isFormVisible = false;
        this.loadEmployees();
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'No se pudo guardar el empleado. Revisa los datos e inténtalo de nuevo.';
      },
    });
  }

  remove(employee: Employee): void {
    if (!confirm(`¿Eliminar a ${this.fullName(employee)}?`)) return;
    this.http.delete(`${this.apiUrl}/${employee.id}`).subscribe({
      next: () => this.loadEmployees(),
      error: () => this.errorMessage = 'No se pudo eliminar el empleado.',
    });
  }

  fullName(employee: Pick<Employee, 'nombre' | 'apellido_paterno' | 'apellido_materno'>): string {
    return [employee.nombre, employee.apellido_paterno, employee.apellido_materno].filter(Boolean).join(' ');
  }

  initials(employee: Employee): string {
    return `${employee.nombre[0] ?? ''}${employee.apellido_paterno[0] ?? ''}`.toUpperCase();
  }

  private emptyForm(): EmployeeForm {
    return { nombre: '', apellidoPaterno: '', apellidoMaterno: '', sueldoBaseMensual: null, fechaIngreso: '' };
  }
}
