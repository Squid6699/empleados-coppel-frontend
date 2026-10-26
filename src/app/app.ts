import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, of } from 'rxjs';
import { Employee, EmployeePayload } from './models/employee.model';
import { EmployeeService } from './services/employee.service';

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
  private readonly employeeService = inject(EmployeeService);

  readonly employees = signal<Employee[]>([]);
  readonly editingId = signal<number | null>(null);
  readonly isFormVisible = signal(false);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);

  form: EmployeeForm = this.emptyForm();

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.isLoading.set(true);
    this.employeeService.list().pipe(
      catchError(() => {
        alert('No se pudo cargar la información. Verifica que el backend esté disponible.');
        return of([]);
      }),
      finalize(() => this.isLoading.set(false)),
    ).subscribe((employees) => this.employees.set(employees));
  }

  startCreating(): void {
    this.editingId.set(null);
    this.form = this.emptyForm();
    this.isFormVisible.set(true);
  }

  startEditing(employee: Employee): void {
    this.editingId.set(employee.id);
    this.form = {
      nombre: employee.nombre,
      apellidoPaterno: employee.apellido_paterno,
      apellidoMaterno: employee.apellido_materno ?? '',
      sueldoBaseMensual: employee.sueldo_base_mensual,
      fechaIngreso: employee.fecha_ingreso,
    };
    this.isFormVisible.set(true);
  }

  closeForm(): void {
    if (!this.isSaving()) this.isFormVisible.set(false);
  }

  save(): void {
    this.isSaving.set(true);
    const payload: EmployeePayload = {
      nombre: this.form.nombre,
      apellido_paterno: this.form.apellidoPaterno,
      apellido_materno: this.form.apellidoMaterno || null,
      sueldo_base_mensual: this.form.sueldoBaseMensual,
      fecha_ingreso: this.form.fechaIngreso,
    };
    const editingId = this.editingId();
    const operation = editingId !== null
      ? this.employeeService.update(editingId, payload)
      : this.employeeService.create(payload);
    operation.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isFormVisible.set(false);
        this.loadEmployees();
      },
      error: () => {
        this.isSaving.set(false);
        alert('No se pudo guardar el empleado. Revisa los datos e inténtalo de nuevo.');
      },
    });
  }

  remove(employee: Employee): void {
    if (!confirm(`¿Eliminar a ${this.fullName(employee)}?`)) return;
    this.employeeService.remove(employee.id).subscribe({
      next: () => this.loadEmployees(),
      error: () => alert('No se pudo eliminar el empleado.'),
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
