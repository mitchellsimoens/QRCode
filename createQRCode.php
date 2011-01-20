<?php

$data = $_REQUEST["data"];
$errorCorrectionLevel = $_REQUEST["correctionLevel"];
$matrixPointSize = $_REQUEST["pointSize"];

$PNG_TEMP_DIR = dirname(__FILE__).DIRECTORY_SEPARATOR.'temp'.DIRECTORY_SEPARATOR;
$PNG_WEB_DIR = 'temp/';
$filename = $PNG_TEMP_DIR.'test'.md5($data.'|'.$errorCorrectionLevel.'|'.$matrixPointSize).'.png';

include "phpqrcode/qrlib.php";

QRcode::png($data, $filename, $errorCorrectionLevel, $matrixPointSize, 2);

$im = file_get_contents($filename);

$imdata = base64_encode($im);

unlink($filename);

$return = array("data" => $data, "correctionLevel" => $errorCorrectionLevel, "pointSize" => $matrixPointSize, "image" => $imdata);

echo json_encode($return);

?>