from django.contrib import admin
from .models import Curso, Matricula, Actividad, Calificacion, Asistencia


@admin.register(Curso)
class CursoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'codigo', 'grado', 'docente', 'numero_horas', 'estado')
    list_filter = ('estado', 'grado')
    search_fields = ('nombre', 'codigo')


@admin.register(Matricula)
class MatriculaAdmin(admin.ModelAdmin):
    list_display = ('estudiante', 'curso', 'periodo', 'estado', 'fecha_matricula')
    list_filter = ('estado', 'periodo')


@admin.register(Actividad)
class ActividadAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'curso', 'tipo', 'ponderacion', 'es_plantilla', 'creada_por')
    list_filter = ('tipo', 'es_plantilla')
    search_fields = ('nombre',)


@admin.register(Calificacion)
class CalificacionAdmin(admin.ModelAdmin):
    list_display = ('estudiante', 'actividad', 'nota')
    search_fields = ('estudiante__user__first_name', 'actividad__nombre')


@admin.register(Asistencia)
class AsistenciaAdmin(admin.ModelAdmin):
    list_display = ('estudiante', 'curso', 'fecha', 'estado')
    list_filter = ('estado', 'fecha')
    search_fields = ('estudiante__user__first_name',)
