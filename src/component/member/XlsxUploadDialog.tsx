import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  FormGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useAtomValue } from 'jotai';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

import { MemberUploadMemberXlsxData, MemberUploadMemberXlsxResponse, memberUploadMemberXlsx } from '@/api';
import { BaseDialog, FileFieldControl as FileField, Form } from '@/component/common';
import { invitationUrl, userState } from '@/store';

const createSchema = (t: (key: string) => string) => {
  const REQUIRED = t('This field is required.');

  const schema: yup.ObjectSchema<Omit<MemberUploadMemberXlsxData, 'accessToken' | 'refreshToken'>> = yup.object({
    formData: yup.object({
      file: yup.mixed<File>().required(REQUIRED),
    }),
    invitationUrl: yup.string().required(REQUIRED).default(invitationUrl),
    commit: yup.boolean().default(false),
    invite: yup.boolean().default(false),
  });

  return schema;
};

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  refresh?: () => void;
}

export const XlsxUploadDialog = ({ open, setOpen, refresh }: Props) => {
  const { t } = useTranslation('member');
  const user = useAtomValue(userState);

  const schema = useMemo(() => createSchema(t), [t]);
  const { handleSubmit, control, setError, formState, reset, clearErrors } = useForm<MemberUploadMemberXlsxData>({
    resolver: yupResolver(schema),
    defaultValues: schema.getDefault(),
  });
  const [result, setResult] = useState<MemberUploadMemberXlsxResponse | null>(null);
  const [invite, setInvite] = useState(true);

  const closeDialog = () => {
    setOpen(false);
    reset();
  };

  const uploadFile = async (data: MemberUploadMemberXlsxData) => {
    if (!user) return;
    clearErrors();

    const commit = !!result;
    memberUploadMemberXlsx({ ...data, commit, invite })
      .then((r) => {
        if (!result) {
          setResult(r);
        } else {
          if (refresh) setTimeout(refresh, 1000);
          closeDialog();
        }
      })
      .catch((error) => setError('root.server', error));
  };

  if (!user || !open) return null;

  return (
    <BaseDialog
      isReady
      open={open}
      setOpen={setOpen}
      onClose={closeDialog}
      fullWidth
      maxWidth="sm"
      renderContent={() => (
        <Box sx={{ position: 'relative' }}>
          <Form id="upload-file" onSubmit={handleSubmit(uploadFile)} formState={formState} setError={setError}>
            <Grid container spacing={2}>
              <Grid size={6}>
                <FileField
                  required
                  name="formData.file"
                  label={t('Select member file.')}
                  control={control}
                  inputProps={{ accept: '.xlsx' }}
                />
              </Grid>
            </Grid>
          </Form>
          {result && (
            <>
              <Divider />
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    {Object.entries(result)
                      .filter(([, value]) => value.length > 0)
                      .map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Typography variant="body2">
                              {t(key)} {`(${value.length})`}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography>{value.join(', ')}</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="body1" sx={{ mt: 5 }}>
                {t('The review result is as above. After confirming the result, please click the complete button.')}
              </Typography>
            </>
          )}
        </Box>
      )}
      actions={
        <Box sx={{ display: 'flex', gap: 1 }}>
          {result && (
            <FormGroup>
              <FormControlLabel
                control={<Checkbox checked={invite} onChange={(e) => setInvite(e.target.checked)} />}
                label={<Typography variant="body2">{t('Send invitation email')}</Typography>}
              />
            </FormGroup>
          )}
          <Button disabled={!formState.isDirty || formState.isSubmitting} form="upload-file" type="submit">
            {result ? t('Complete') : t('Upload file')}
          </Button>
        </Box>
      }
    />
  );
};
