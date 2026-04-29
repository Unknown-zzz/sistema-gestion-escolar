from django.db import models
from accounts.models import Estudiante, Docente, Grado, User


class Curso(models.Model):
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=20, unique=True)
    grado = models.ForeignKey(Grado, on_delete=models.CASCADE, related_name='cursos')
    docente = models.ForeignKey(Docente, on_delete=models.SET_NULL, null=True, blank=True, related_name='cursos')
    descripcion = models.TextField(blank=True)
    numero_horas = models.IntegerField()
    creditos = models.IntegerField(default=0)
    estado = models.BooleanField(default=True)

    class Meta:
        unique_together = ('nombre', 'grado')

    def __str__(self):
        return f"{self.nombre} ({self.grado})"


class Matricula(models.Model):
    ESTADO_CHOICES = (
        ('activo', 'Activo'),
        ('retirado', 'Retirado'),
        ('culminado', 'Culminado'),
    )

    estudiante = models.ForeignKey(Estudiante, on_delete=models.CASCADE, related_name='matriculas')
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE, related_name='matriculas')
    periodo = models.CharField(max_length=10)
    fecha_matricula = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='activo')

    class Meta:
        unique_together = ('estudiante', 'curso', 'periodo')

    def __str__(self):
        return f"{self.estudiante} en {self.curso} ({self.periodo})"


class Actividad(models.Model):
    TIPO_CHOICES = (
        ('tarea', 'Tarea'),
        ('examen', 'Examen'),
        ('proyecto', 'Proyecto'),
        ('participacion', 'Participación'),
        ('otro', 'Otro'),
    )

    curso = models.ForeignKey(Curso, on_delete=models.CASCADE, related_name='actividades', null=True, blank=True)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='tarea')
    fecha = models.DateField(null=True, blank=True)
    ponderacion = models.FloatField(default=0)
    es_plantilla = models.BooleanField(default=False)
    creada_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='actividades')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombre} - {self.curso}"


class Calificacion(models.Model):
    estudiante = models.ForeignKey(Estudiante, on_delete=models.CASCADE, related_name='calificaciones')
    actividad = models.ForeignKey(Actividad, on_delete=models.CASCADE, related_name='calificaciones')
    nota = models.FloatField(null=True, blank=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)
    creada_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='calificaciones_creadas')

    class Meta:
        unique_together = ('estudiante', 'actividad')

    def __str__(self):
        return f"{self.estudiante} - {self.actividad.nombre}: {self.nota}"


class Asistencia(models.Model):
    ESTADO_CHOICES = (
        ('P', 'Presente'),
        ('F', 'Falta'),
        ('L', 'Licencia'),
    )

    estudiante = models.ForeignKey(Estudiante, on_delete=models.CASCADE, related_name='asistencias')
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE, related_name='asistencias')
    fecha = models.DateField()
    estado = models.CharField(max_length=1, choices=ESTADO_CHOICES, default='P')
    motivo = models.TextField(blank=True)
    registrada_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='asistencias_registradas')
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('estudiante', 'curso', 'fecha')
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.estudiante} - {self.fecha}: {self.estado}"
