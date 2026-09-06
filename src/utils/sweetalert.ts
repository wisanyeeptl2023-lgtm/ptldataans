import Swal from 'sweetalert2';

export const showSuccessAlert = async (title: string, text?: string) => {
  return await Swal.fire({
    icon: 'success',
    title,
    text: text || 'ดำเนินการบันทึกข้อมูลเรียบร้อยแล้ว',
    confirmButtonText: 'ตกลง',
    confirmButtonColor: '#10b981', // emerald
    timer: 2200,
    timerProgressBar: true,
  });
};

export const showErrorAlert = async (title: string, text?: string) => {
  return await Swal.fire({
    icon: 'error',
    title,
    text: text || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
    confirmButtonText: 'ตกลง',
    confirmButtonColor: '#ef4444',
  });
};

export const showConfirmDialog = async (title: string, text: string): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'ยืนยันลบ',
    cancelButtonText: 'ยกเลิก',
  });
  return result.isConfirmed;
};

export const showLoadingAlert = (title: string = 'กำลังบันทึกข้อมูล...') => {
  Swal.fire({
    title,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

export const closeAlert = () => {
  Swal.close();
};
