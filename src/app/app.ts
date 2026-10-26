import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, map, of, timeout } from 'rxjs';

interface ApiEmployee {
  id: number;
  nombre: string;
  apellido_paterno?: string;
  apellidoPaterno?: string;
  apellido_materno?: string;
  apellidoMaterno?: string;
  sueldo_base_mensual?: number;
  sueldoBaseMensual?: number;
  fecha_ingreso?: string;
  fechaIngreso?: string;
  dias_vacaciones?: number;
  diasVacaciones?: number;
  aguinaldo?: number;
}

interface Employee {
  id: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  sueldo_base_mensual: number;
  fecha_ingreso: string;
  dias_vacaciones: number;
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
  private readonly changeDetector = inject(ChangeDetectorRef);
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
    this.http.get<ApiEmployee[] | { empleados?: ApiEmployee[]; employees?: ApiEmployee[] }>(this.apiUrl).pipe(
      timeout(10000),
      map((response) => {
        const apiEmployees = Array.isArray(response)
          ? response
          : response.empleados ?? response.employees ?? [];
        return apiEmployees.map((employee) => ({
          id: employee.id,
          nombre: employee.nombre,
          apellido_paterno: employee.apellido_paterno ?? employee.apellidoPaterno ?? '',
          apellido_materno: employee.apellido_materno ?? employee.apellidoMaterno,
          sueldo_base_mensual: employee.sueldo_base_mensual ?? employee.sueldoBaseMensual ?? 0,
          fecha_ingreso: employee.fecha_ingreso ?? employee.fechaIngreso ?? '',
          dias_vacaciones: employee.dias_vacaciones ?? employee.diasVacaciones ?? 0,
          aguinaldo: employee.aguinaldo ?? 0,
        }));
      }),
      catchError(() => {
        this.errorMessage = 'No se pudo cargar la información. Verifica que el backend esté disponible.';
        return of([]);
      }),
      finalize(() => {
        this.isLoading = false;
        this.changeDetector.detectChanges();
      }),
    ).subscribe({
      next: (employees) => {
        this.employees = employees;
        this.changeDetector.detectChanges();
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
