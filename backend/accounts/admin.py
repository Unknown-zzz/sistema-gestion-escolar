from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Grado, Estudiante, Docente


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_active')
    list_filter = ('role', 'is_active')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-created_at',)
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Información adicional', {'fields': ('role', 'phone', 'address', 'profile_image')}),
    )


@admin.register(Grado)
class GradoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'nivel', 'cantidad_secciones', 'estado')
    list_filter = ('nivel', 'estado')


@admin.register(Estudiante)
class EstudianteAdmin(admin.ModelAdmin):
    list_display = ('user', 'numero_expediente', 'documento', 'grado', 'estado')
    list_filter = ('estado', 'grado')
    search_fields = ('user__first_name', 'user__last_name', 'numero_expediente', 'documento')


@admin.register(Docente)
class DocenteAdmin(admin.ModelAdmin):
    list_display = ('user', 'documento', 'especialidad', 'estado')
    list_filter = ('estado',)
    search_fields = ('user__first_name', 'user__last_name', 'documento')
